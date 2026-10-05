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
        if ($pedido->estado === 'cancelado') {
            return ['success' => false, 'message' => 'El pedido ya está cancelado.'];
        }

        if ($pedido->pago?->estado === 'reembolso_pendiente') {
            return ['success' => false, 'message' => 'El reembolso de Niubiz ya está pendiente de anulación manual.'];
        }

        $transaction = TransaccionPago::where('pedido_id', $pedido->id)
            ->where('pasarela', 'niubiz')
            ->where('estado', 'exitoso')
            ->latest('id')
            ->first();

        if (!$transaction || !in_array($pedido->estado, ['Pagado', 'procesando', 'enviado', 'completado'], true)) {
            return ['success' => false, 'message' => 'El pedido no tiene un pago Niubiz completado.'];
        }

        Pago::updateOrCreate(
            ['pedido_id' => $pedido->id],
            ['metodo' => 'niubiz', 'monto' => $transaction->monto, 'estado' => 'reembolso_pendiente']
        );

        return ['success' => true, 'message' => 'Reembolso pendiente: anula el pago en el portal Niubiz antes de cancelar el pedido y devolver el stock.'];
    }

    /** @return array{success: bool, message: string} */
    public function confirmManualRefund(Pedido $pedido): array
    {
        if ($pedido->pago?->estado !== 'reembolso_pendiente') {
            return ['success' => false, 'message' => 'Este pedido no tiene una anulación Niubiz pendiente.'];
        }

        $transaction = TransaccionPago::where('pedido_id', $pedido->id)
            ->where('pasarela', 'niubiz')
            ->where('estado', 'exitoso')
            ->latest('id')
            ->first();
        if (!$transaction) {
            return ['success' => false, 'message' => 'No se encontró la transacción original de Niubiz.'];
        }

        try {
            DB::transaction(function () use ($pedido, $transaction) {
                $pedido->pago->update(['estado' => 'reembolsado']);
                app(UpdateOrderStatusService::class)->execute($pedido, ['estado' => 'cancelado']);
                $transaction->update(['estado' => 'reembolsado']);
            });
        } catch (\Throwable $e) {
            return ['success' => false, 'message' => 'No se pudo confirmar la anulación del pedido.'];
        }

        return ['success' => true, 'message' => 'Anulación confirmada. El pedido fue cancelado y el stock devuelto.'];
    }
}
