<?php

namespace Tests\Feature;

use App\Jobs\Omnichannel\ProcessIncomingWebhookJob;
use App\Jobs\RunCrmAutomationJob;
use App\Jobs\SendMarketingRecipientJob;
use App\Mail\MarketingCampaignMail;
use App\Models\CrmAutomation;
use App\Models\CrmDeal;
use App\Models\MarketingCampaign;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Usuario;
use App\Models\Variante;
use App\Services\Admin\Crm\PublicWebhookUrl;
use App\Services\Checkout\BenefitReservations;
use App\Services\Omnichannel\WhatsAppMediaService;
use App\Services\Omnichannel\WhatsAppService;
use App\Services\Orders\UpdateOrderStatusService;
use App\Services\SunatService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\MailManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PanelHardeningRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_webhooks_reject_loopback_private_and_credentials(): void
    {
        foreach (['http://example.com', 'https://127.0.0.1', 'https://10.0.0.1', 'https://[::1]', 'https://user:password@example.com', 'https://example.com:8080'] as $url) {
            try {
                PublicWebhookUrl::resolve($url);
                $this->fail('Debe bloquear '.$url);
            } catch (\InvalidArgumentException $e) {
                $this->assertNotEmpty($e->getMessage());
            }
        }
    }

    public function test_campaign_retry_does_not_send_recipient_twice(): void
    {
        Mail::fake();
        $user = Usuario::factory()->create();
        $campaign = MarketingCampaign::create(['name' => 'Prueba', 'subject' => 'Prueba', 'content' => 'Hola', 'segment' => 'all', 'status' => 'sending', 'author_id' => $user->id]);
        $id = DB::table('marketing_deliveries')->insertGetId(['campaign_id' => $campaign->id, 'usuario_id' => $user->id, 'email' => $user->email, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
        $job = new SendMarketingRecipientJob($id);
        $job->handle();
        $job->handle();
        Mail::assertSent(MarketingCampaignMail::class, 1);
        $this->assertDatabaseHas('marketing_deliveries', ['id' => $id, 'status' => 'sent', 'attempts' => 1]);
        $this->assertEquals(1, $campaign->fresh()->sent_count);
    }

    public function test_automation_replay_uses_snapshot_and_sends_only_once(): void
    {
        config(['mail.default' => 'array']);
        Mail::swap(new MailManager($this->app));
        $user = Usuario::factory()->create();
        $deal = new CrmDeal(['usuario_id' => $user->id, 'titulo' => 'Capturado', 'estado' => 'won']);
        $deal->setRelation('cliente', $user);
        $deal->setRelation('empresa', null);
        CrmAutomation::create(['nombre' => 'Prueba', 'activo' => true, 'trigger_type' => 'deal_won', 'condiciones' => [['field' => 'estado', 'operator' => '==', 'value' => 'won']], 'acciones' => [['type' => 'send_email', 'message' => 'Ganado']]]);
        $job = new RunCrmAutomationJob('deal_won', $deal);
        $deal->estado = 'lost';
        $job->handle();
        $job->handle();
        $this->assertCount(1, Mail::mailer()->getSymfonyTransport()->messages());
        $this->assertDatabaseCount('automation_executions', 1);
    }

    public function test_concurrent_pending_orders_cannot_reserve_same_points(): void
    {
        $user = Usuario::factory()->create(['loyalty_points' => 100]);
        $one = Pedido::create(['usuario_id' => $user->id, 'codigo' => 'RES-1', 'subtotal' => 20, 'total' => 20, 'estado' => 'Pendiente', 'puntos_usados' => 100]);
        $two = Pedido::create(['usuario_id' => $user->id, 'codigo' => 'RES-2', 'subtotal' => 20, 'total' => 20, 'estado' => 'Pendiente', 'puntos_usados' => 100]);
        DB::transaction(fn () => BenefitReservations::reserve($one));
        $this->expectException(ValidationException::class);
        DB::transaction(fn () => BenefitReservations::reserve($two));
    }

    public function test_unpaid_order_cannot_advance_and_cancellation_never_creates_inventory(): void
    {
        Queue::fake();
        $user = Usuario::factory()->create();
        $order = Pedido::create(['usuario_id' => $user->id, 'codigo' => 'UNPAID', 'subtotal' => 20, 'total' => 20, 'estado' => 'Pendiente']);
        try {
            app(UpdateOrderStatusService::class)->execute($order, ['estado' => 'enviado']);
            $this->fail('No debe avanzar sin pago.');
        } catch (\InvalidArgumentException $e) {
            $this->assertSame('Pendiente', $order->fresh()->estado);
        }
        app(UpdateOrderStatusService::class)->execute($order, ['estado' => 'cancelado']);
        $this->assertDatabaseCount('inventory_returns', 0);
        $this->assertDatabaseCount('order_notification_outbox', 2);
    }

    public function test_niubiz_repeat_and_cancelled_orders_never_call_gateway(): void
    {
        Http::fake();
        $order = Pedido::create(['codigo' => 'PAY-REPLAY', 'subtotal' => 20, 'total' => 20, 'estado' => 'cancelado']);
        $session = ['niubiz_amount' => 20, 'niubiz_purchaseNumber' => '000000101', 'checkout_pedido' => $order->codigo];
        $this->withSession($session)->post(route('checkout.niubiz.authorize'), ['transactionToken' => 'token'])->assertRedirect(route('checkout'))->assertSessionHas('error');
        $this->assertDatabaseCount('payment_reconciliations', 0);
        DB::table('payment_reconciliations')->insert(['purchase_number' => '000000101', 'pedido_id' => $order->id, 'amount' => 20, 'status' => 'approved', 'reference_hash' => hash('sha256', 'token'), 'created_at' => now(), 'updated_at' => now()]);
        $this->withSession($session)->post(route('checkout.niubiz.authorize'), ['transactionToken' => 'token'])->assertRedirect(route('checkout'))->assertSessionHas('error');
        Http::assertNothingSent();
    }

    public function test_whatsapp_webhook_replay_persists_only_one_message_and_counter(): void
    {
        Event::fake();
        Http::fake(['*' => Http::response(['success' => true])]);
        $job = new ProcessIncomingWebhookJob(['field' => 'messages', 'value' => ['messages' => [['from' => '51999999999', 'id' => 'wamid.test', 'type' => 'text', 'text' => ['body' => 'Hola']]]]]);
        $job->handle(app(WhatsAppService::class), app(WhatsAppMediaService::class));
        $job->handle(app(WhatsAppService::class), app(WhatsAppMediaService::class));
        $this->assertDatabaseCount('omnichannel_messages', 1);
        $this->assertDatabaseCount('omnichannel_contacts', 1);
        $this->assertDatabaseHas('omnichannel_conversations', ['message_count' => 1, 'unread_count' => 1]);
    }

    public function test_invoice_lines_reconcile_discount_shipping_and_snapshot_tax(): void
    {
        config(['services.apiperu.url' => 'https://billing.example.test', 'services.apiperu.token' => 'test']);
        Http::fake(['*' => Http::response(['success' => true])]);
        $user = Usuario::factory()->create();
        $product = Producto::factory()->create();
        $variant = Variante::factory()->create(['producto_id' => $product->id]);
        $order = Pedido::create(['usuario_id' => $user->id, 'codigo' => 'BILL-1', 'subtotal' => 100, 'total' => 90, 'costo_envio' => 10, 'estado' => 'pagado', 'tipo_comprobante' => 'factura', 'invoice_snapshot' => ['igv_porcentaje' => 18, 'documento_cliente' => '20123456789', 'nombre_cliente' => 'Empresa original', 'costo_envio' => 10]]);
        $order->items()->create(['variante_id' => $variant->id, 'cantidad' => 2, 'precio_unitario' => 50, 'sku' => 'ORIGINAL', 'producto_nombre' => 'Producto original']);
        $this->assertTrue(app(SunatService::class)->emitirComprobante($order)['success']);
        Http::assertSent(fn ($request) => $request['tipo_de_comprobante'] === '01' && $request['cliente_denominacion'] === 'Empresa original' && abs(array_sum(array_column($request['items'], 'total')) - 90) < 0.001 && abs($request['total_gravada'] + $request['total_igv'] - 90) < 0.001 && $request['items'][0]['codigo'] === 'ORIGINAL');
    }
}
