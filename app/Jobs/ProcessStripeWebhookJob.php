<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Checkout\CheckoutService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessStripeWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [60, 120, 300]; // Reintentos: 1m, 2m, 5m

    public function __construct(
        private readonly array $paymentIntentData
    ) {}

    public function handle(CheckoutService $checkoutService): void
    {
        $codigoPedido = $this->paymentIntentData['metadata']['codigo_pedido'] ?? null;
        $montoSoles = ($this->paymentIntentData['amount'] ?? 0) / 100;
        $email = $this->paymentIntentData['metadata']['email'] ?? null;
        $paymentIntentId = $this->paymentIntentData['id'] ?? null;

        if (!$codigoPedido || !$paymentIntentId) {
            Log::warning("ProcessStripeWebhookJob: Falta codigo_pedido o id en el payment intent.");
            return;
        }

        $log = \App\Models\WebhookLog::firstOrCreate(
            ['provider' => 'stripe', 'event_id' => $paymentIntentId],
            ['type' => 'payment_intent.succeeded', 'payload' => $this->paymentIntentData, 'status' => 'pending']
        );

        if (!$log->wasRecentlyCreated && $log->status === 'processed') {
            Log::info("ProcessStripeWebhookJob: El evento {$paymentIntentId} ya fue procesado anteriormente.");
            return;
        }

        try {
            Log::info("ProcessStripeWebhookJob: Procesando pago exitoso para {$codigoPedido}");
            
            $changed = $checkoutService->processSuccessfulPayment($codigoPedido, $montoSoles, $paymentIntentId);
            
            if ($changed) {
                $checkoutService->finalizeSuccessAction($codigoPedido, $email);
                Log::info("ProcessStripeWebhookJob: Pedido {$codigoPedido} procesado correctamente.");
            } else {
                Log::info("ProcessStripeWebhookJob: Pedido {$codigoPedido} no fue modificado (probablemente ya estaba pagado).");
            }

            $log->update(['status' => 'processed']);
        } catch (\Exception $e) {
            $log->update(['status' => 'failed', 'exception_message' => $e->getMessage()]);
            // Re-lanzar para que la Queue lo reintente si es necesario
            Log::error("ProcessStripeWebhookJob: Error procesando pago de {$codigoPedido}: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(Throwable $exception): void
    {
        Log::critical("ProcessStripeWebhookJob falló para el intent data: " . json_encode($this->paymentIntentData) . " - Error: " . $exception->getMessage());
    }
}
