<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Pedido;
use App\Services\SunatService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessSunatInvoiceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Número de veces que el trabajo puede intentarse.
     */
    public int $tries = 3;

    /**
     * Segundos a esperar antes de reintentar el trabajo.
     */
    public int $backoff = 30;

    public function __construct(
        private readonly Pedido $pedido
    ) {}

    public function handle(SunatService $sunatService): void
    {
        // Verificar que el pedido aún exista y esté pagado
        if (! $this->pedido->exists || ! in_array(strtolower($this->pedido->estado), ['pagado', 'procesando', 'enviado', 'completado'], true)) {
            Log::info("ProcessSunatInvoiceJob: El pedido {$this->pedido->codigo} no existe o no está pagado. Cancelando job.");

            return;
        }
        if ($this->pedido->facturado_sunat) {
            return;
        }

        // Idempotencia: Verificar si ya tiene comprobante emitido
        // Asumiendo que SunatService o el Pedido guardan estado del comprobante.
        // Si el modelo Pedido no tiene un campo 'comprobante_emitido', asumimos que
        // SunatService->emitirComprobante() maneja la idempotencia o lanza excepción si ya existe.

        Log::info("ProcessSunatInvoiceJob: Iniciando emisión de comprobante para pedido {$this->pedido->codigo}");

        $result = $sunatService->emitirComprobante($this->pedido);
        if (! ($result['success'] ?? false)) {
            throw new \RuntimeException($result['error'] ?? $result['message'] ?? 'La emisión no fue confirmada por el proveedor.');
        }

        Log::info("ProcessSunatInvoiceJob: Comprobante emitido exitosamente para pedido {$this->pedido->codigo}");
    }

    public function failed(Throwable $exception): void
    {
        Log::error("ProcessSunatInvoiceJob falló permanentemente para el pedido {$this->pedido->codigo}: ".$exception->getMessage());
        // Aquí se podría notificar a Slack/Email al administrador sobre el fallo crítico en facturación
    }
}
