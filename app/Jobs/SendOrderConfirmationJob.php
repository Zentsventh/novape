<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\OrderCreated;
use App\Models\Pedido;
use App\Services\Orders\InvoiceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmationJob implements ShouldQueue
{
    use Queueable;

    protected $pedidoId;

    protected $correoDestino;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    /**
     * Create a new job instance.
     */
    public function __construct($pedidoId, $correoDestino = null)
    {
        $this->pedidoId = $pedidoId;
        $this->correoDestino = $correoDestino;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $pedido = Pedido::with(['usuario', 'items.variante.producto', 'envio', 'pago'])->find($this->pedidoId);

            if (! $pedido) {
                Log::warning("Job SendOrderConfirmationJob abortado: Pedido {$this->pedidoId} no encontrado.");

                return;
            }

            // Invoice emission is handled by ProcessSunatInvoiceJob, never by mail delivery.
            $pdfContent = app(InvoiceService::class)->generatePdf($pedido)->output();

            $email = $this->correoDestino ?: ($pedido->usuario ? $pedido->usuario->email : null);

            if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Mail::to($email)->send(new OrderCreated($pedido, $pdfContent));
            } else {
                Log::warning("Job SendOrderConfirmationJob: No hay un correo válido para el pedido {$this->pedidoId}.");
            }
        } catch (\Throwable $e) {
            Log::error("Error en SendOrderConfirmationJob para pedido {$this->pedidoId}: ".$e->getMessage());
            throw $e;
        }
    }
}
