<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;
use App\Models\RmaRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PartialRefundService
{
    public function request(Pedido $order, int $rmaId, string $key, int $actor): void
    {
        DB::transaction(function () use ($order, $rmaId, $key, $actor) {
            $order = Pedido::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (DB::table('refund_requests')->where('request_key', $key)->where('pedido_id', $order->id)->where('rma_id', $rmaId)->exists()) return;
            $rma = RmaRequest::whereKey($rmaId)->where('pedido_id', $order->id)->whereIn('type', ['return','exchange'])->where('status', 'processed')->lockForUpdate()->firstOrFail();
            if (DB::table('refund_requests')->where('rma_id', $rmaId)->exists()) $this->invalid('Esta devolución ya tiene una solicitud de reembolso.');
            if ($order->pago?->estado !== 'completado' || ! in_array(strtolower($order->estado), OrderTransitions::REVENUE_STATES, true)) $this->invalid('El pedido necesita un pago confirmado y no debe tener una anulación total pendiente.');
            $order->load('items');
            $gross = (float) $order->items->sum(fn ($item) => $item->precio_unitario * $item->cantidad);
            $merchandise = max(0, (float) $order->total - (float) $order->costo_envio);
            if ($gross <= 0) $this->invalid('No se pudo calcular el importe original.');
            $value = 0;
            $previousReturns = DB::table('refund_requests')->where('pedido_id', $order->id)->whereNotNull('rma_id')->whereIn('status', ['pending', 'confirmed'])->pluck('rma_id');
            foreach ($rma->items as $line) {
                $item = $order->items->firstWhere('id', $line->pedido_item_id);
                if (! $item || $line->cantidad <= 0 || $line->cantidad > $item->cantidad) $this->invalid('Las cantidades devueltas no corresponden al pedido.');
                $alreadyRequested = DB::table('rma_items')->whereIn('rma_request_id', $previousReturns)->where('pedido_item_id', $item->id)->sum('cantidad');
                if ($alreadyRequested + $line->cantidad > $item->cantidad) $this->invalid('Las unidades ya reembolsadas o solicitadas exceden la compra original.');
                $lineNet = $item->net_total !== null ? (float)$item->net_total : $item->cantidad*(float)$item->precio_unitario*$merchandise/$gross;
                $value += $lineNet*$line->cantidad/$item->cantidad;
            }
            $amount = round($value, 2);
            $reserved = (float) DB::table('refund_requests')->where('pedido_id', $order->id)->whereIn('status', ['pending', 'confirmed'])->sum('amount');
            $remaining = round($merchandise - $reserved, 2);
            if ($amount > $remaining && $amount - $remaining <= 0.011) $amount = $remaining;
            if ($amount <= 0 || $amount > $remaining) $this->invalid('El importe excede el saldo reembolsable de productos.');
            DB::table('refund_requests')->insert(['pedido_id' => $order->id, 'rma_id' => $rmaId, 'request_key' => $key, 'amount' => $amount,
                'status' => 'pending', 'requested_by' => $actor, 'created_at' => now(), 'updated_at' => now()]);
        });
    }

    public function confirm(Pedido $order, int $id, array $data, int $actor): void
    {
        DB::transaction(function () use ($order, $id, $data, $actor) {
            $order = Pedido::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $refund = DB::table('refund_requests')->where('id', $id)->where('pedido_id', $order->id)->lockForUpdate()->firstOrFail();
            if ($refund->status === 'confirmed') {
                if ($refund->provider_reference !== $data['provider_reference'] || abs((float) $data['amount'] - (float) $refund->amount) > 0.001) $this->invalid('Los datos no coinciden con la confirmación original.');
                return;
            }
            if ($refund->status !== 'pending' || abs((float) $data['amount'] - (float) $refund->amount) > 0.001) $this->invalid('El importe no coincide con la solicitud pendiente.');
            if (DB::table('refund_requests')->where('provider_reference', $data['provider_reference'])->where('id', '!=', $id)->exists()) $this->invalid('Esta referencia ya fue utilizada.');
            DB::table('refund_requests')->where('id', $id)->update(['status' => 'confirmed', 'provider_reference' => $data['provider_reference'],
                'evidence' => $data['evidence'], 'confirmed_by' => $actor, 'confirmed_at' => now(), 'updated_at' => now()]);
            if (! $refund->rma_id) {
                $result = app(RefundOrderService::class)->confirmManualRefund($order);
                if (! $result['success']) $this->invalid($result['message']);
            } else {
                $refunded = (float) DB::table('refund_requests')->where('pedido_id', $order->id)->where('status', 'confirmed')->sum('amount');
                OrderLoyaltyService::partialRefund($order, $refunded);
                // Physical stock was already processed by RMA; confirmation never restores it twice.
            }
        });
    }

    private function invalid(string $message): never { throw ValidationException::withMessages(['refund' => $message]); }
}
