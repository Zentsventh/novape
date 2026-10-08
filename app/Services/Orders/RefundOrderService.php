<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pago;
use App\Models\Pedido;
use App\Models\TransaccionPago;
use Illuminate\Support\Facades\DB;

class RefundOrderService
{
    /** @return array{success: bool, message: string} */
    public function execute(Pedido $pedido): array
    {
        return DB::transaction(function () use ($pedido) {
            $pedido = Pedido::whereKey($pedido->id)->lockForUpdate()->firstOrFail();
            $pago = Pago::where('pedido_id', $pedido->id)->lockForUpdate()->first();
            if ($pedido->estado === 'cancelado') {
                return ['success' => false, 'message' => 'El pedido ya está cancelado.'];
            }

            if ($pago?->estado === 'reembolsado') {
                return ['success' => false, 'message' => 'El pago ya fue reembolsado.'];
            }
            if ($pago?->estado === 'reembolso_pendiente') {
                return ['success' => false, 'message' => 'El reembolso de Niubiz ya está pendiente de anulación manual.'];
            }
            if (DB::table('refund_requests')->where('pedido_id', $pedido->id)->where('status', 'pending')->exists()) {
                return ['success' => false, 'message' => 'Resuelve primero el reembolso parcial pendiente.'];
            }

            $transaction = TransaccionPago::where('pedido_id', $pedido->id)
                ->where('pasarela', 'niubiz')
                ->where('estado', 'exitoso')
                ->latest('id')->lockForUpdate()
                ->first();

            if (! $transaction || ! in_array(strtolower($pedido->estado), ['pagado', 'procesando', 'enviado', 'completado'], true)) {
                return ['success' => false, 'message' => 'El pedido no tiene un pago Niubiz completado.'];
            }

            Pago::updateOrCreate(
                ['pedido_id' => $pedido->id],
                ['metodo' => 'niubiz', 'monto' => $transaction->monto, 'estado' => 'reembolso_pendiente']
            );
            $alreadyRefunded = (float) DB::table('refund_requests')->where('pedido_id', $pedido->id)->where('status', 'confirmed')->sum('amount');
            $remaining = round((float) $transaction->monto - $alreadyRefunded, 2);
            if ($remaining <= 0) throw new \InvalidArgumentException('No queda saldo reembolsable.');
            DB::table('refund_requests')->insert(['pedido_id' => $pedido->id, 'request_key' => (string) \Illuminate\Support\Str::uuid(),
                'amount' => $remaining, 'status' => 'pending', 'requested_by' => auth('admin')->id(), 'created_at' => now(), 'updated_at' => now()]);

            return ['success' => true, 'message' => 'Reembolso pendiente: confirma la devolución del dinero en Niubiz. Los artículos despachados requieren recepción e inspección mediante RMA.'];
        });
    }

    /** @return array{success: bool, message: string} */
    public function confirmManualRefund(Pedido $pedido): array
    {
        try {
            return DB::transaction(function () use ($pedido) {
                $pedido = Pedido::whereKey($pedido->id)->lockForUpdate()->firstOrFail();
                $pago = Pago::where('pedido_id', $pedido->id)->lockForUpdate()->first();
                if ($pedido->estado === 'cancelado' && $pago?->estado === 'reembolsado') {
                    return ['success' => true, 'message' => 'La anulación ya fue confirmada.'];
                }
                if ($pago?->estado !== 'reembolso_pendiente') {
                    return ['success' => false, 'message' => 'Este pedido no tiene una anulación Niubiz pendiente.'];
                }
                if (! DB::table('refund_requests')->where('pedido_id', $pedido->id)->whereNull('rma_id')->where('status', 'confirmed')->exists()) {
                    return ['success' => false, 'message' => 'Registra primero la evidencia y referencia de la devolución de dinero.'];
                }

                $transaction = TransaccionPago::where('pedido_id', $pedido->id)
                    ->where('pasarela', 'niubiz')
                    ->where('estado', 'exitoso')
                    ->latest('id')->lockForUpdate()
                    ->first();
                if (! $transaction) {
                    return ['success' => false, 'message' => 'No se encontró la transacción original de Niubiz.'];
                }

                $pago->update(['estado' => 'reembolsado']);
                $pedido->setRelation('pago', $pago);
                app(UpdateOrderStatusService::class)->execute($pedido, ['estado' => 'cancelado']);
                $transaction->update(['estado' => 'reembolsado']);

                return ['success' => true, 'message' => 'Anulación confirmada. El pedido fue cancelado; los artículos despachados requieren recepción física mediante RMA.'];
            });
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'No se pudo confirmar la anulación del pedido.'];
        }

    }
}
