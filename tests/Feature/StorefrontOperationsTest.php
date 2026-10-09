<?php

namespace Tests\Feature;

use App\Http\Controllers\ReviewController;
use App\Jobs\DeliverStorefrontTask;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Services\Admin\Operations\PanelHealthService;
use App\Services\Marketing\MarketingConsent;
use App\Services\Orders\OrderLoyaltyService;
use App\Services\Orders\PartialRefundService;
use App\Services\Orders\PaymentReconciliationService;
use App\Services\Orders\StorefrontTaskService;
use App\Services\Orders\UpdateOrderStatusService;
use App\Services\Shipping\PickupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class StorefrontOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake(); Mail::fake(); Http::preventStrayRequests();
        config(['audit.enabled' => false, 'inertia.ssr.enabled' => false]);
    }

    private function order(?Usuario $user = null, string $state = 'pagado'): Pedido
    {
        return Pedido::create(['usuario_id' => $user?->id, 'codigo' => 'TEST-'.Str::uuid(), 'subtotal' => 100,
            'total' => 100, 'estado' => $state, 'costo_envio' => 0,
            'direccion_envio_snapshot' => ['email' => 'guest@example.com', 'nombres' => 'Guest']]);
    }

    private function variant(): int
    {
        $product = DB::table('producto')->insertGetId(['nombre' => 'Producto prueba', 'sku_base' => 'P-'.Str::uuid(), 'activo' => true]);
        return DB::table('variante')->insertGetId(['producto_id' => $product, 'sku' => 'V-'.Str::uuid(), 'precio' => 50, 'activo' => true]);
    }

    public function test_consent_is_explicit_and_revocable_without_overwriting_other_fields(): void
    {
        $user = Usuario::factory()->create(['custom_fields' => ['store_consent' => ['terms' => true], 'other' => 'keep']]);
        $role = DB::table('rol')->insertGetId(['nombre' => 'cliente']);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $role]);
        $this->assertFalse(MarketingConsent::allows($user));
        MarketingConsent::update($user, true);
        $this->assertTrue(MarketingConsent::allows($user->fresh()));
        $this->assertSame(1, MarketingConsent::audience()->count());
        MarketingConsent::update($user, false);
        $this->assertSame(0, MarketingConsent::audience()->count());
        $this->assertSame('keep', data_get($user->fresh()->custom_fields, 'other'));
        $this->assertTrue(data_get($user->fresh()->custom_fields, 'store_consent.terms'));
    }

    public function test_unsubscribe_requires_a_signature_and_the_original_recipient(): void
    {
        $user = Usuario::factory()->create();
        MarketingConsent::update($user, true);
        $url = URL::signedRoute('marketing.unsubscribe', ['user' => $user->id, 'recipient' => hash('sha256', mb_strtolower($user->email))]);
        $this->post($url)->assertOk();
        $this->assertFalse(MarketingConsent::allows($user->fresh()));
        $this->post('/comunicaciones/baja?user='.$user->id)->assertForbidden();
        $user->update(['email' => 'changed@example.com']);
        $this->post($url)->assertForbidden();
    }

    public function test_paid_tasks_are_durable_and_idempotent_and_invoice_requires_a_provider(): void
    {
        config(['invoicing.notify_email' => true, 'invoicing.notify_whatsapp' => false, 'services.apiperu.token' => null]);
        $order = $this->order();
        StorefrontTaskService::recordPaid($order);
        StorefrontTaskService::recordPaid($order);
        $this->assertDatabaseCount('storefront_tasks', 2);
        $id = DB::table('storefront_tasks')->where('kind', 'invoice')->value('id');
        (new DeliverStorefrontTask($id))->handle();
        $this->assertDatabaseHas('storefront_tasks', ['id' => $id, 'status' => 'blocked', 'attempts' => 0]);
        Http::assertNothingSent();
    }

    public function test_interrupted_delivery_is_not_automatically_resent(): void
    {
        StorefrontTaskService::record('interrupted', 'confirmation_email', null, 'guest@example.com');
        $id = DB::table('storefront_tasks')->value('id');
        DB::table('storefront_tasks')->where('id', $id)->update(['status' => 'processing', 'started_at' => now()->subMinutes(11)]);
        StorefrontTaskService::recover();
        (new DeliverStorefrontTask($id))->handle();
        $this->assertDatabaseHas('storefront_tasks', ['id' => $id, 'status' => 'needs_review']);
        Mail::assertNothingSent();
    }

    public function test_tracking_is_persisted_in_both_views_and_guests_receive_a_notification(): void
    {
        $order = $this->order(null, 'procesando');
        DB::table('pago')->insert(['pedido_id' => $order->id, 'metodo' => 'niubiz', 'estado' => 'completado', 'monto' => 100]);
        $service = app(UpdateOrderStatusService::class);
        $data = ['estado' => 'enviado', 'tracking_number' => 'TRACK-123', 'courier_name' => 'Courier prueba', 'estado_envio' => 'Enviado'];
        $service->execute($order, $data);
        $this->assertDatabaseHas('pedido', ['id' => $order->id, 'tracking_number' => 'TRACK-123']);
        $this->assertDatabaseHas('envio', ['pedido_id' => $order->id, 'tracking' => 'TRACK-123', 'proveedor' => 'Courier prueba']);
        $this->assertDatabaseHas('order_notification_outbox', ['pedido_id' => $order->id, 'destination' => 'guest@example.com']);
        $service->execute($order, $data);
        $this->assertDatabaseCount('order_notification_outbox', 1);
    }

    public function test_awarded_points_are_reversed_only_once_after_partial_and_full_refunds(): void
    {
        $user = Usuario::factory()->create(['loyalty_points' => 0, 'custom_fields'=>['store_consent'=>['loyalty_program'=>true]]]);
        $order = $this->order($user);
        OrderLoyaltyService::completed($order);
        OrderLoyaltyService::completed($order);
        $this->assertSame(10, (int) $user->fresh()->loyalty_points);
        DB::transaction(fn () => OrderLoyaltyService::partialRefund($order, 50));
        DB::transaction(fn () => OrderLoyaltyService::partialRefund($order, 50));
        $this->assertSame(5, (int) $user->fresh()->loyalty_points);
        DB::transaction(fn () => OrderLoyaltyService::reversed($order));
        DB::transaction(fn () => OrderLoyaltyService::reversed($order));
        $this->assertSame(0, (int) $user->fresh()->loyalty_points);
    }

    public function test_partial_refund_uses_paid_unit_value_and_never_restores_stock_twice(): void
    {
        $user = Usuario::factory()->create();
        $order = $this->order($user);
        $order->update(['subtotal' => 120, 'descuento' => 30, 'costo_envio' => 10, 'total' => 100]);
        $variant = $this->variant();
        $item = DB::table('pedido_item')->insertGetId(['pedido_id' => $order->id, 'variante_id' => $variant, 'cantidad' => 2, 'precio_unitario' => 60]);
        DB::table('pago')->insert(['pedido_id' => $order->id, 'metodo' => 'niubiz', 'estado' => 'completado', 'monto' => 100]);
        $rma = DB::table('rma_requests')->insertGetId(['usuario_id' => $user->id, 'pedido_id' => $order->id, 'type' => 'return', 'status' => 'processed', 'reason' => 'other']);
        DB::table('rma_items')->insert(['rma_request_id' => $rma, 'pedido_item_id' => $item, 'cantidad' => 1, 'condicion' => 'revisar']);
        $key = (string) Str::uuid(); $service = app(PartialRefundService::class);
        $service->request($order, $rma, $key, $user->id);
        $service->request($order, $rma, $key, $user->id);
        $this->assertDatabaseCount('refund_requests', 1);
        $id = DB::table('refund_requests')->value('id');
        $this->assertDatabaseHas('refund_requests', ['id' => $id, 'amount' => 45, 'status' => 'pending']);
        $data = ['amount' => 45, 'provider_reference' => 'NIUBIZ-REF-1', 'evidence' => 'Confirmed in provider dashboard'];
        $service->confirm($order, $id, $data, $user->id);
        $service->confirm($order, $id, $data, $user->id);
        $this->assertDatabaseHas('refund_requests', ['id' => $id, 'status' => 'confirmed']);
        $this->assertDatabaseCount('inventory_returns', 0);
        Http::assertNothingSent();
    }

    public function test_an_approved_payment_cannot_be_reclassified_as_declined(): void
    {
        $order = $this->order();
        $id = DB::table('payment_reconciliations')->insertGetId(['pedido_id' => $order->id, 'purchase_number' => '000000101',
            'status' => 'approved', 'amount' => 100, 'reference_hash' => hash('sha256', 'token'), 'created_at' => now()->subMinutes(10), 'updated_at' => now()]);
        $this->expectException(ValidationException::class);
        app(PaymentReconciliationService::class)->resolve($id, ['result' => 'declined', 'amount' => 100, 'currency' => 'PEN', 'provider_reference' => 'REF', 'evidence' => 'test'], 1);
    }

    public function test_refund_requests_cannot_repeat_original_units(): void
    {
        $user = Usuario::factory()->create(); $order = $this->order($user);
        $order->update(['costo_envio' => 80]); $variant = $this->variant();
        $item = DB::table('pedido_item')->insertGetId(['pedido_id' => $order->id, 'variante_id' => $variant, 'cantidad' => 2, 'precio_unitario' => 50]);
        DB::table('pago')->insert(['pedido_id' => $order->id, 'metodo' => 'niubiz', 'estado' => 'completado', 'monto' => 100]);
        $service = app(PartialRefundService::class);
        foreach ([1, 2] as $quantity) {
            $rma = DB::table('rma_requests')->insertGetId(['usuario_id' => $user->id, 'pedido_id' => $order->id, 'type' => 'return', 'status' => 'processed', 'reason' => 'other']);
            DB::table('rma_items')->insert(['rma_request_id' => $rma, 'pedido_item_id' => $item, 'cantidad' => $quantity, 'condicion' => 'revisar']);
            if ($quantity === 2) {
                $this->expectException(ValidationException::class);
                $this->expectExceptionMessage('Las unidades ya reembolsadas o solicitadas exceden la compra original.');
            }
            $service->request($order, $rma, (string) Str::uuid(), $user->id);
        }
    }

    public function test_cart_activity_invalidates_an_old_recovery_task(): void
    {
        $user = Usuario::factory()->create(); MarketingConsent::update($user, true);
        $variant = $this->variant();
        $cart = $user->carrito()->create(['session_id' => 'test-session']);
        $cart->items()->create(['variante_id' => $variant, 'cantidad' => 1]);
        DB::table('carrito')->where('id', $cart->id)->update(['updated_at' => now()->subHours(25)]);
        $this->artisan('carts:recover-abandoned')->assertSuccessful();
        $this->assertDatabaseCount('storefront_tasks', 1);
        $id = DB::table('storefront_tasks')->value('id');
        $this->actingAs($user);
        app(\App\Services\Cart\CartService::class)->syncCartToDB([['variante_id' => $variant, 'cantidad' => 2]], 'test-session');
        $this->assertNull($cart->fresh()->notified_at);
        $this->assertTrue($cart->fresh()->updated_at->greaterThan(now()->subMinute()));
        (new DeliverStorefrontTask($id))->handle();
        $this->assertDatabaseHas('storefront_tasks', ['id' => $id, 'status' => 'skipped']);
        Mail::assertNothingSent();
    }

    public function test_declined_quotes_get_a_new_purchase_number_and_uncertain_payments_block_another_charge(): void
    {
        $order = $this->order(null, 'pendiente'); $variant = $this->variant();
        $cart = [['id' => DB::table('variante')->where('id', $variant)->value('producto_id'), 'variante_id' => $variant, 'cantidad' => 2, 'precio' => 50]];
        $service = \Mockery::mock(\App\Services\Checkout\CheckoutService::class);
        $service->shouldReceive('validateAndCalculateTotal')->twice()->andReturn(['total' => 100, 'totalConDescuento' => 112,
            'descuentoMonto' => 0, 'puntosUsados' => 0, 'couponId' => null, 'cart' => $cart]);
        $service->shouldReceive('reserveStock')->twice(); $service->shouldReceive('createPendingOrder')->twice()->andReturn($order);
        $this->app->instance(\App\Services\Checkout\CheckoutService::class, $service);
        config(['services.niubiz.env' => 'sandbox', 'services.shippo.key' => null]);
        Http::fake(['*/api.security/*' => Http::response('security-fixture'), '*/api.ecommerce/*' => Http::response(['sessionKey' => 'session-fixture'])]);
        $payload = ['email' => 'guest@example.com', 'facturacion' => ['comprobante' => 'Boleta'], 'deliveryType' => 'domicilio',
            'shippingAddress' => ['nombres' => 'Ana', 'apellidos' => 'Prueba', 'celular' => '987654321', 'doc' => '12345678', 'direccion' => 'Av. Prueba 123', 'distrito' => 'Ate']];
        $first = $this->withSession(['cart' => $cart, 'checkout_pedido' => $order->codigo])->postJson('/api/checkout/niubiz/session', $payload)->assertOk();
        $attempt = DB::table('payment_reconciliations')->where('purchase_number',$first->json('purchaseNumber'))->value('id');
        $this->assertDatabaseHas('payment_reconciliations',['id'=>$attempt,'status'=>'prepared']);
        DB::table('payment_reconciliations')->where('id',$attempt)->update(['status'=>'declined','reference_hash'=>hash('sha256','old-token')]);
        $second = $this->postJson('/api/checkout/niubiz/session', $payload)->assertOk();
        $this->assertNotSame($first->json('purchaseNumber'), $second->json('purchaseNumber'));
        Http::assertSentCount(4);
        DB::table('payment_reconciliations')->where('id', $attempt)->update(['status' => 'needs_review']);
        $this->postJson('/api/checkout/niubiz/session', $payload)->assertStatus(409);
        Http::assertSentCount(4);
    }

    public function test_operations_and_settings_require_staff_and_render_for_an_admin(): void
    {
        $this->getJson('/admin/tienda/operaciones')->assertUnauthorized();
        $admin = Usuario::factory()->create();
        $role = DB::table('rol')->where('nombre', 'admin')->value('id') ?: DB::table('rol')->insertGetId(['nombre' => 'admin']);
        DB::table('usuario_rol')->insert(['usuario_id' => $admin->id, 'rol_id' => $role]);
        $this->actingAs($admin, 'admin')->get('/admin/tienda/operaciones')->assertOk();
        $this->get('/admin/tienda/configuracion')->assertOk();
        $this->get('/admin/reviews')->assertOk();
    }

    public function test_only_completed_buyers_can_publish_reviews(): void
    {
        $user = Usuario::factory()->create(); $order = $this->order($user);
        $variant = $this->variant(); $product = DB::table('variante')->where('id', $variant)->value('producto_id');
        DB::table('pedido_item')->insert(['pedido_id' => $order->id, 'variante_id' => $variant, 'cantidad' => 1, 'precio_unitario' => 50]);
        $this->assertFalse(ReviewController::eligible($product, $user->id));
        $order->update(['estado' => 'completado']);
        $this->assertTrue(ReviewController::eligible($product, $user->id));
        $this->assertFalse(ReviewController::eligible($product, Usuario::factory()->create()->id));
        $this->actingAs($user)->post('/producto/'.$product.'/resenas', ['calificacion' => 5, 'comentario' => 'Excelente producto de prueba'])->assertRedirect();
        $this->assertDatabaseHas('resenas', ['producto_id' => $product, 'usuario_id' => $user->id, 'aprobado' => false]);
    }

    public function test_pickup_requires_a_real_address_and_hours(): void
    {
        \App\Models\ConfiguracionSitio::establecer('pickup_enabled', '1');
        $this->assertSame([], PickupService::options());
        $this->expectException(ValidationException::class);
        PickupService::select(999);
    }

    public function test_health_checks_async_workers_even_if_default_queue_is_sync(): void
    {
        config(['queue.default' => 'sync', 'storefront.queue_connection' => 'storefront']);
        Cache::flush();
        $health = app(PanelHealthService::class)->snapshot();
        $this->assertTrue($health['checks']['worker']['ok']);
        $this->assertFalse($health['checks']['worker_storefront']['ok']);
        $this->assertFalse($health['checks']['worker_chatbot']['ok']);
        $this->assertFalse($health['checks']['worker_team_realtime']['ok']);
        Cache::put(PanelHealthService::workerKey('database', 'team-realtime'), now()->timestamp, 600);
        $this->assertTrue(app(PanelHealthService::class)->snapshot()['checks']['worker_team_realtime']['ok']);
        $this->assertFalse($health['ok']);
    }

    public function test_rfm_distinguishes_old_customers_and_reaches_champion(): void
    {
        $old = Usuario::factory()->create(); $champion = Usuario::factory()->create();
        $order = $this->order($old); $order->forceFill(['created_at' => now()->subDays(500)])->save();
        for ($i = 0; $i < 10; $i++) $this->order($champion)->update(['total' => 500]);
        $this->artisan('crm:calculate-rfm')->assertSuccessful();
        $this->assertSame('112', $old->fresh()->rfm_score);
        $this->assertSame('555', $champion->fresh()->rfm_score);
        $this->assertSame('Campeón', $champion->fresh()->segmento);
    }
}
