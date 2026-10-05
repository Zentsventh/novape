<?php

namespace Tests\Feature;

use App\Jobs\ProcessSunatInvoiceJob;
use App\Jobs\SendOrderConfirmationJob;
use App\Mail\OrderCreated;
use App\Models\CajaMovimiento;
use App\Models\CajaSesion;
use App\Models\CrmActivity;
use App\Models\CrmAutomation;
use App\Models\CrmCompany;
use App\Models\CrmCustomFieldSchema;
use App\Models\CrmDeal;
use App\Models\CrmEvidenceLedger;
use App\Models\CrmPipeline;
use App\Models\CrmStage;
use App\Models\Marca;
use App\Models\Pago;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Rol;
use App\Models\TransaccionPago;
use App\Models\Usuario;
use App\Models\Variante;
use App\Services\Admin\Crm\AutomationEngineService;
use App\Services\Admin\Crm\CrmPipelineService;
use App\Services\Admin\Crm\WebhookDnsResolver;
use App\Services\AIEnrichmentService;
use App\Services\Orders\InvoiceService;
use App\Services\Orders\RefundOrderService;
use App\Services\Orders\UpdateOrderStatusService;
use App\Services\Shipping\ShippingCalculationService;
use App\Services\ShippoService;
use App\Services\SunatService;
use Barryvdh\DomPDF\PDF;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\RequestException;
use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AdminExtendedIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Queue::fake();
        Http::preventStrayRequests();
    }

    private function user(bool $admin = false): Usuario
    {
        $user = Usuario::create(['nombres' => 'Persona', 'apellidos' => 'Prueba', 'email' => uniqid().'@example.test', 'password_hash' => 'test-hash', 'estado' => 'activo']);
        if ($admin) {
            $user->roles()->attach(Rol::firstOrCreate(['nombre' => 'admin'])->id);
        }

        return $user;
    }

    private function order(string $state = 'pagado'): Pedido
    {
        return Pedido::create(['codigo' => 'TEST-'.uniqid(), 'usuario_id' => $this->user()->id, 'subtotal' => 100, 'total' => 100, 'estado' => $state]);
    }

    private function deal(): CrmDeal
    {
        $pipeline = CrmPipeline::create(['nombre' => 'Prueba']);
        $stage = CrmStage::create(['pipeline_id' => $pipeline->id, 'nombre' => 'Inicio', 'orden' => 1]);

        return CrmDeal::create(['titulo' => 'Empresa sin contacto', 'stage_id' => $stage->id, 'usuario_id' => null, 'estado' => 'open']);
    }

    public function test_all_application_models_can_be_loaded_without_missing_traits(): void
    {
        foreach (File::allFiles(app_path('Models')) as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }
            $class = 'App\\Models\\'.str_replace(['/', '.php'], ['\\', ''], $file->getRelativePathname());
            $this->assertTrue(class_exists($class), $class);
        }
        $ledger = CrmEvidenceLedger::create(['model_type' => 'company', 'model_id' => 1, 'field_name' => 'sector', 'suggested_value' => 'Retail', 'confidence_score' => 80, 'source' => 'https://example.test', 'status' => 'pending']);
        $this->assertNotNull($ledger->id);
    }

    public function test_register_movement_can_load_its_register_relation(): void
    {
        $user = $this->user();
        $register = CajaSesion::create(['cajero_id' => $user->id, 'monto_inicial' => 10, 'fecha_apertura' => now(), 'estado' => 'abierta']);
        $movement = CajaMovimiento::create(['caja_sesion_id' => $register->id, 'usuario_id' => $user->id, 'tipo' => 'ingreso', 'monto' => 5, 'concepto' => 'Prueba']);
        $this->assertSame($register->id, $movement->cajaSesion->id);
        $this->assertSame($user->id, $register->cajero->id);
    }

    public function test_order_confirmation_attaches_pdf_without_emitting_another_invoice(): void
    {
        $order = $this->order();
        $pdf = \Mockery::mock(PDF::class);
        $pdf->shouldReceive('output')->once()->andReturn('%PDF-test');
        $this->mock(InvoiceService::class)->shouldReceive('generatePdf')->once()->andReturn($pdf);
        (new SendOrderConfirmationJob($order->id))->handle();
        Mail::assertSent(OrderCreated::class, fn ($mail) => $mail->pedido->id === $order->id && $mail->pdfContent === '%PDF-test');
        Http::assertNothingSent();
    }

    public function test_order_confirmation_failure_is_available_to_queue_retry(): void
    {
        $order = $this->order();
        $this->mock(InvoiceService::class)->shouldReceive('generatePdf')->once()->andThrow(new \RuntimeException('PDF no disponible'));
        $this->expectException(\RuntimeException::class);
        (new SendOrderConfirmationJob($order->id))->handle();
    }

    public function test_already_emitted_invoice_job_does_not_call_provider_again(): void
    {
        $order = $this->order();
        $order->facturado_sunat = true;
        $service = $this->mock(SunatService::class);
        $service->shouldNotReceive('emitirComprobante');
        (new ProcessSunatInvoiceJob($order))->handle($service);
        $this->assertTrue($order->facturado_sunat);
    }

    public function test_refund_reads_current_payment_instead_of_stale_order_relation(): void
    {
        $order = $this->order('pagado');
        $payment = Pago::create(['pedido_id' => $order->id, 'metodo' => 'niubiz', 'estado' => 'completado', 'monto' => 100]);
        TransaccionPago::create(['pedido_id' => $order->id, 'pasarela' => 'niubiz', 'referencia_pasarela' => uniqid(), 'monto' => 100, 'estado' => 'exitoso']);
        $order->load('pago');
        $this->assertTrue(app(RefundOrderService::class)->execute($order)['success']);
        $payment->refresh()->update(['estado' => 'reembolsado']);
        $this->assertFalse(app(RefundOrderService::class)->execute($order)['success']);
        $this->assertSame('reembolsado', $payment->refresh()->estado);
    }

    public function test_repeated_refund_confirmation_does_not_cancel_or_restock_twice(): void
    {
        $order = $this->order();
        $payment = Pago::create(['pedido_id' => $order->id, 'metodo' => 'niubiz', 'estado' => 'reembolso_pendiente', 'monto' => 100]);
        TransaccionPago::create(['pedido_id' => $order->id, 'pasarela' => 'niubiz', 'referencia_pasarela' => uniqid(), 'monto' => 100, 'estado' => 'exitoso']);
        $this->mock(UpdateOrderStatusService::class)->shouldReceive('execute')->once()->andReturnUsing(function ($pedido) {
            $pedido->update(['estado' => 'cancelado']);
        });
        $this->assertTrue(app(RefundOrderService::class)->confirmManualRefund($order)['success']);
        $this->assertTrue(app(RefundOrderService::class)->confirmManualRefund($order)['success']);
        $this->assertSame('reembolsado', $payment->refresh()->estado);
    }

    public function test_company_deal_without_contact_can_preserve_and_filter_custom_fields(): void
    {
        $deal = $this->deal();
        app(CrmPipelineService::class)->updateCustomFields($deal, ['sector' => 'Retail']);
        app(CrmPipelineService::class)->updateCustomFields($deal, ['telefono' => '123']);
        $this->assertSame('Retail', $deal->refresh()->custom_fields->get('sector'));
        $this->assertSame('123', $deal->custom_fields->get('telefono'));
        $this->assertSame(1, CrmDeal::withCustomAttributes()->count());
        $this->assertSame(1, CrmDeal::withCustomAttributes(['sector' => 'Retail'])->count());
        $this->assertSame(0, CrmDeal::withCustomAttributes(['sector' => 'Salud'])->count());
    }

    public function test_invalid_automation_is_rejected_before_saving(): void
    {
        $this->actingAs($this->user(true), 'admin')->postJson('/admin/crm/automations', [
            'nombre' => 'Prueba', 'trigger_type' => 'deal_created', 'acciones' => [['type' => 'webhook', 'url' => 'no-es-url']],
        ])->assertUnprocessable();
        $this->assertSame(0, CrmAutomation::count());
    }

    public function test_automation_webhook_failure_is_not_reported_as_success(): void
    {
        $deal = $this->deal();
        CrmAutomation::create(['nombre' => 'Webhook', 'trigger_type' => 'deal_created', 'activo' => true, 'acciones' => [['type' => 'webhook', 'url' => 'https://example.com/hook']]]);
        Http::fake(['*' => Http::response([], 500)]);
        $this->mock(WebhookDnsResolver::class)->shouldReceive('addresses')->with('example.com')->andReturn(['93.184.216.34']);
        $this->expectException(RequestException::class);
        AutomationEngineService::run('deal_created', $deal);
    }

    public function test_automation_email_uses_deal_customer_relation(): void
    {
        $deal = $this->deal();
        $customer = $this->user();
        $deal->update(['usuario_id' => $customer->id]);
        CrmAutomation::create(['nombre' => 'Email', 'trigger_type' => 'deal_created', 'activo' => true, 'acciones' => [['type' => 'send_email', 'message' => 'Prueba']]]);
        // Mail::raw is a direct Mailer call; use the array transport to inspect it without delivery.
        config(['mail.default' => 'array']);
        Mail::swap(new MailManager($this->app));
        AutomationEngineService::run('deal_created', $deal);
        $transport = Mail::mailer()->getSymfonyTransport();
        $this->assertCount(1, $transport->messages());
        $this->assertSame($customer->email, $transport->messages()->first()->getOriginalMessage()->getTo()[0]->getAddress());
    }

    public function test_product_policy_uses_real_permissions_and_denies_blocked_accounts(): void
    {
        $staff = $this->user();
        $role = Rol::create(['nombre' => 'editor']);
        $staff->roles()->attach($role);
        $permission = DB::table('permiso')->where('nombre', 'editar_producto')->value('id');
        DB::table('rol_permiso')->insert(['rol_id' => $role->id, 'permiso_id' => $permission]);
        $product = new Producto;
        $this->assertTrue(Gate::forUser($staff)->allows('update', $product));
        $this->assertFalse(Gate::forUser($staff)->allows('create', Producto::class));
        $staff->estado = 'bloqueado';
        $this->assertFalse(Gate::forUser($staff)->allows('update', $product));
    }

    public function test_enrichment_stores_only_provider_evidence_for_known_fields(): void
    {
        $company = CrmCompany::create(['nombre' => 'Empresa']);
        config(['services.enrichment.url' => 'https://example.test/research', 'services.enrichment.token' => 'test-token']);
        Http::fake(['*' => Http::response(['evidence' => [
            ['field_name' => 'sector', 'value' => 'Retail', 'source' => 'https://example.test/company', 'confidence' => 80],
            ['field_name' => 'desconocido', 'value' => 'Ignorar', 'source' => 'https://example.test/company', 'confidence' => 80],
        ]])]);
        $fields = [(object) ['model_type' => 'company', 'name' => 'sector', 'type' => 'text']];
        app(AIEnrichmentService::class)->researchEntity('company', $company->id, 'Empresa', $fields);
        $this->assertSame(1, CrmEvidenceLedger::count());
        $this->assertSame('Retail', CrmEvidenceLedger::first()->suggested_value);
        $this->assertSame('pending', CrmEvidenceLedger::first()->status);
        $this->assertNull($company->refresh()->custom_fields->get('sector'));
        Http::assertSentCount(1);
    }

    public function test_missing_enrichment_provider_cannot_invent_evidence(): void
    {
        config(['services.enrichment.url' => null, 'services.enrichment.token' => null]);
        $this->expectException(\LogicException::class);
        app(AIEnrichmentService::class)->researchEntity('company', 1, 'Empresa', []);
    }

    public function test_invoice_service_refreshes_stale_orders_and_does_not_emit_twice(): void
    {
        $order = $this->order();
        $product = Producto::factory()->create();
        $variant = Variante::factory()->create(['producto_id' => $product->id]);
        $order->items()->create(['variante_id' => $variant->id, 'cantidad' => 1, 'precio_unitario' => 100, 'producto_nombre' => $product->nombre]);
        $stale = Pedido::findOrFail($order->id);
        config(['services.apiperu.url' => 'https://example.test/invoice', 'services.apiperu.token' => 'test-token']);
        Http::fake(['*' => Http::response(['success' => true, 'data' => ['enlaces' => ['pdf' => 'https://example.test/document.pdf', 'xml' => 'https://example.test/document.xml']]])]);
        $this->assertTrue(app(SunatService::class)->emitirComprobante($order)['success']);
        $this->assertTrue(app(SunatService::class)->emitirComprobante($stale)['success']);
        Http::assertSentCount(1);
    }

    public function test_invoice_lock_prevents_a_second_worker_from_calling_provider(): void
    {
        $order = $this->order();
        config(['services.apiperu.url' => 'https://example.test/invoice', 'services.apiperu.token' => 'test-token']);
        Http::fake();
        $lock = Cache::lock('sunat_invoice_'.$order->id, 120);
        $this->assertTrue($lock->get());
        try {
            $this->assertFalse(app(SunatService::class)->emitirComprobante($order)['success']);
        } finally {
            $lock->release();
        }
        Http::assertNothingSent();
    }

    public function test_invoice_service_rejects_pending_orders_without_network_calls(): void
    {
        $order = $this->order('pendiente');
        config(['services.apiperu.url' => 'https://example.test/invoice', 'services.apiperu.token' => 'test-token']);
        Http::fake();
        $this->assertFalse(app(SunatService::class)->emitirComprobante($order)['success']);
        Http::assertNothingSent();
    }

    public function test_valid_company_automation_can_be_saved_without_external_requests(): void
    {
        $this->actingAs($this->user(true), 'admin')->post('/admin/crm/automations', [
            'nombre' => 'Empresa nueva', 'trigger_type' => 'company_created',
            'acciones' => [['type' => 'create_task', 'message' => 'Revisar empresa']],
        ])->assertSessionHasNoErrors();
        $this->assertSame(1, CrmAutomation::count());
        Http::assertNothingSent();
    }

    public function test_company_custom_fields_are_supported_in_both_creation_forms(): void
    {
        $this->actingAs($this->user(true), 'admin')->post('/admin/crm/custom-fields', [
            'model_type' => 'company', 'name' => 'sector_empresa', 'label' => 'Sector', 'type' => 'text',
        ])->assertSessionHasNoErrors();
        $this->post('/admin/crm/settings/objects/fields', [
            'model_type' => 'company', 'name' => 'sector_empresa', 'label' => 'Duplicado', 'type' => 'text',
        ])->assertSessionHasErrors('name');
        $this->assertSame(1, CrmCustomFieldSchema::where('name', 'sector_empresa')->count());
    }

    public function test_company_automation_creates_a_task_with_the_actual_staff_author(): void
    {
        $this->user();
        $staff = $this->user(true);
        $company = CrmCompany::create(['nombre' => 'Empresa']);
        CrmAutomation::create(['nombre' => 'Seguimiento', 'trigger_type' => 'company_created', 'activo' => true,
            'acciones' => [['type' => 'create_task', 'message' => 'Contactar empresa']]]);
        AutomationEngineService::run('company_created', $company, ['actor_id' => $staff->id]);
        $task = CrmActivity::firstOrFail();
        $this->assertNull($task->deal_id);
        $this->assertSame($company->id, $task->empresa_id);
        $this->assertSame($staff->id, $task->usuario_id);
        $this->actingAs($staff, 'admin')->put('/admin/crm/tasks/'.$task->id, [
            'deal_id' => null, 'empresa_id' => $company->id, 'tipo' => 'tarea', 'contenido' => 'Contenido editado',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Contenido editado', $task->refresh()->contenido);
        $this->postJson('/admin/crm/tasks/'.$task->id.'/complete', ['completado' => 'false'])->assertUnprocessable();
        $this->post('/admin/crm/tasks/'.$task->id.'/complete', ['completado' => true])->assertSessionHasNoErrors();
        $this->assertTrue($task->refresh()->completada);
    }

    public function test_tracking_cannot_disclose_another_customers_order(): void
    {
        $order = $this->order();
        $this->actingAs($this->user(), 'web')->get('/perfil/seguimiento?codigo='.$order->codigo)->assertForbidden();
        Http::assertNothingSent();
    }

    public function test_shipping_uses_variant_weight_instead_of_a_nonexistent_product_column(): void
    {
        $brand = Marca::create(['nombre' => 'Prueba']);
        $product = Producto::create(['nombre' => 'Producto', 'sku_base' => 'WEIGHT', 'marca_id' => $brand->id]);
        $variant = Variante::create(['producto_id' => $product->id, 'sku' => 'WEIGHT-1', 'precio' => 10, 'stock' => 10, 'peso' => 2, 'activo' => true]);
        $provider = $this->mock(ShippoService::class);
        $provider->shouldReceive('getShippingRate')->once()->with(\Mockery::any(), \Mockery::any(), 6.0)->andReturn(20.0);
        $result = app(ShippingCalculationService::class)->calculateCost([
            ['id' => $product->id, 'variante_id' => $variant->id, 'cantidad' => 3],
        ], ['departamento' => 'Lima']);
        $this->assertEquals(20, $result['costo']);
    }
}
