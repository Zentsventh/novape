<?php

declare(strict_types=1);

namespace Tests\Feature\Checkout;

use App\Models\ConfiguracionSitio;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\ReservaStock;
use App\Models\Usuario;
use App\Models\Variante;
use App\Services\Checkout\CheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use App\Jobs\ProcessSunatInvoiceJob;
use App\Jobs\ProcessStripeWebhookJob;

class CheckoutFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Configuración básica para tests de ecommerce
        ConfiguracionSitio::create(['clave' => 'almacen_ecommerce_id', 'valor' => '1']);
        ConfiguracionSitio::create(['clave' => 'envio_tarifa_plana', 'valor' => '15']);
        
        // Insertar un almacén dummy para evitar foreign key errors si existieran
        DB::table('almacenes')->insert([
            'id' => 1,
            'nombre' => 'Almacén Principal Ecommerce',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_checkout_service_valida_correctamente_totales_y_stock(): void
    {
        $usuario = Usuario::factory()->create();
        $producto = Producto::factory()->create(['activo' => 1]);
        $variante = Variante::factory()->create([
            'producto_id' => $producto->id,
            'precio' => 100,
            'stock' => 5
        ]);

        $cart = [
            [
                'variante_id' => $variante->id,
                'cantidad' => 2,
                'precio' => 100,
                'nombre' => $producto->nombre
            ]
        ];

        $checkoutService = app(CheckoutService::class);
        $data = $checkoutService->validateAndCalculateTotal($cart, null, 15.0);

        $this->assertEquals(200, $data['total']);
        $this->assertEquals(215, $data['totalConDescuento']); // +15 de envío

        // Probar Reserva de stock
        $sessionId = 'test_session_id';
        $checkoutService->reserveStock($cart, $sessionId);
        
        $this->assertDatabaseHas('reservas_stock', [
            'variante_id' => $variante->id,
            'cantidad' => 2,
            'session_id' => $sessionId
        ]);
    }

    public function test_no_permite_comprar_sin_stock(): void
    {
        $producto = Producto::factory()->create(['activo' => 1]);
        $variante = Variante::factory()->create([
            'producto_id' => $producto->id,
            'precio' => 100,
            'stock' => 1 // Solo 1 en stock
        ]);

        $cart = [
            [
                'variante_id' => $variante->id,
                'cantidad' => 2, // Intentar comprar 2
                'precio' => 100,
                'nombre' => $producto->nombre
            ]
        ];

        $checkoutService = app(CheckoutService::class);
        
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Stock insuficiente");

        $checkoutService->reserveStock($cart, 'test_session_id');
    }

    public function test_webhook_stripe_dispatch_jobs_and_idempotency(): void
    {
        $this->withoutExceptionHandling();
        Queue::fake();
        
        $mockGateway = $this->mock(\App\Services\Payment\StripePaymentGateway::class, function ($mock) {
            $mock->shouldReceive('verifyWebhookSignature')->andReturn((object)[
                'type' => 'payment_intent.succeeded',
                'data' => (object)[
                    'object' => (object)[
                        'id' => 'pi_test_123',
                        'amount' => 21500,
                        'metadata' => (object)[
                            'codigo_pedido' => 'PED-TEST-123',
                            'email' => 'test@example.com'
                        ]
                    ]
                ]
            ]);
        });

        $usuario = Usuario::factory()->create(['email' => 'test@example.com']);
        $pedido = Pedido::factory()->create([
            'usuario_id' => $usuario->id,
            'estado' => 'Pendiente',
            'total' => 215.0,
            'codigo' => 'PED-TEST-123'
        ]);

        $webhookPayload = [
            'type' => 'payment_intent.succeeded',
            'data' => [
                'object' => [
                    'id' => 'pi_test_123',
                    'amount' => 21500, // En centavos
                    'metadata' => [
                        'codigo_pedido' => 'PED-TEST-123',
                        'email' => $usuario->email
                    ]
                ]
            ]
        ];
        
        config(['services.stripe.webhook_secret' => 'whsec_test']);

        // 1. Probar que el endpoint devuelve 200 rápido y despacha el Job principal de Webhook
        $response = $this->postJson('/webhook/stripe', $webhookPayload);
        $response->assertStatus(200);
        $response->assertStatus(200);
        
        // Verifica que el Stripe Webhook Job se encoló
        Queue::assertPushed(ProcessStripeWebhookJob::class);

        // 2. Simular ejecución del Webhook Job para comprobar idempotencia y tablas de auditoría
        $job = new ProcessStripeWebhookJob($webhookPayload['data']['object']);
        $job->handle(app(CheckoutService::class));

        $pedido->refresh();
        $this->assertEquals('Pagado', $pedido->estado);

        // Verifica que se haya guardado el Webhook Log
        $this->assertDatabaseHas('webhook_logs', [
            'provider' => 'stripe',
            'event_id' => $webhookPayload['data']['object']['id'],
            'status' => 'processed'
        ]);

        // Verifica que se haya creado la transacción de pago
        $this->assertDatabaseHas('transacciones_pago', [
            'pedido_id' => $pedido->id,
            'payment_intent_id' => $webhookPayload['data']['object']['id'],
            'pasarela' => 'stripe',
            'monto' => 215.00,
            'estado' => 'exitoso'
        ]);
        
        // Verifica que el Sunat Job se encoló tras pagar el pedido
        Queue::assertPushed(ProcessSunatInvoiceJob::class, function ($job) use ($pedido) {
            $prop = new \ReflectionProperty($job, 'pedido');
            $prop->setAccessible(true);
            return $prop->getValue($job)->id === $pedido->id;
        });

        // 3. Simular un duplicado de Webhook de Stripe (Idempotencia)
        $jobDuplicado = new ProcessStripeWebhookJob($webhookPayload['data']['object']);
        $jobDuplicado->handle(app(CheckoutService::class));

        // Debería seguir Pagado sin explotar y no debería haber otra transacción ni cambiar el estado a procesado de nuevo
        $this->assertEquals('Pagado', $pedido->estado);
        $this->assertDatabaseCount('webhook_logs', 1);
        $this->assertDatabaseCount('transacciones_pago', 1);
    }
}
