<?php

declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

use App\Models\ConfiguracionSitio;
use App\Models\RmaRequest;
use App\Services\Inventory\ReturnLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RmaProcessingService
{
    public function updateStatus(int $id, string $status, ?string $notes, int $userId, ?array $lines = null): RmaRequest
    {
        return DB::transaction(function () use ($id, $status, $notes, $userId, $lines) {
            $orderId = RmaRequest::whereKey($id)->value('pedido_id');
            $lockedOrder = \App\Models\Pedido::whereKey($orderId)->lockForUpdate()->firstOrFail();
            if ($lockedOrder->usuario_id) \App\Models\Usuario::whereKey($lockedOrder->usuario_id)->lockForUpdate()->firstOrFail();
            $rma = RmaRequest::lockForUpdate()->findOrFail($id);
            $transitions = [
                'pending' => ['approved', 'rejected'],
                'approved' => ['received', 'rejected'],
                'received' => ['processed'],
                'processed' => [],
                'rejected' => [],
            ];
            if ($rma->status !== $status && ! in_array($status, $transitions[$rma->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'La transición de estado de la devolución no está permitida.']);
            }
            if ($rma->status !== $status && $status === 'processed' && $rma->type === 'warranty' && !trim($notes ?? '')) throw ValidationException::withMessages(['admin_notes'=>'Documenta el diagnóstico y la solución real de la garantía.']);
            if ($rma->status !== $status && $status === 'processed' && in_array($rma->type, ['return','exchange'],true)) {
                $pedido = $rma->pedido()->lockForUpdate()->firstOrFail();
                if ($pedido->stock_returned_at || !$pedido->stock_consumed_at) {
                    throw ValidationException::withMessages(['status' => 'Este pedido no tiene unidades pendientes de recepción física.']);
                }
                $pedido->load(['items.variante'=>fn($q)=>$q->withTrashed()]);
                $eligible = $pedido->items->filter(fn ($item) => $item->variante && (! $rma->producto_id || $item->variante->producto_id == $rma->producto_id));
                if ($eligible->isEmpty()) {
                    throw ValidationException::withMessages(['items' => 'La devolución no contiene artículos del pedido.']);
                }
                $saved = $rma->items()->get();
                $lines ??= $saved->isNotEmpty() ? $saved->toArray() : [];
                if (! $lines || count(array_column($lines, 'pedido_item_id')) !== count(array_unique(array_column($lines, 'pedido_item_id')))) {
                    throw ValidationException::withMessages(['items' => 'Selecciona líneas únicas y cantidades positivas.']);
                }
                DB::table('variante')->whereIn('id', $eligible->pluck('variante_id')->filter()->unique())->orderBy('id')->lockForUpdate()->get(['id']);
                $warehouses = $eligible->map(fn ($item) => (int) ($item->almacen_id ?: ConfiguracionSitio::obtener('almacen_ecommerce_id', 1)))->unique()->sort()->values();
                DB::table('almacenes')->whereIn('id', $warehouses)->orderBy('id')->lockForUpdate()->get(['id']);
                foreach (collect($lines)->sortBy('pedido_item_id') as $line) {
                    $item = $eligible->firstWhere('id', (int) $line['pedido_item_id']);
                    if (! $item) {
                        throw ValidationException::withMessages(['items' => 'La línea seleccionada no pertenece a esta devolución.']);
                    }
                    $qty = (int) $line['cantidad'];
                    if (! in_array($line['condicion'] ?? '', ['vendible', 'no_vendible'], true)) {
                        throw ValidationException::withMessages(['items' => 'Indica si el artículo puede volver a venderse.']);
                    }
                    app(ReturnLedger::class)->restore($item, $qty, 'rma:'.$rma->id.':'.$item->id,
                        (int) ($item->almacen_id ?: ConfiguracionSitio::obtener('almacen_ecommerce_id', 1)), $userId, 'Devolución RMA '.$rma->id, $line['condicion'] === 'vendible');
                    $rma->items()->updateOrCreate(['pedido_item_id' => $item->id], ['cantidad' => $qty, 'condicion' => $line['condicion'] ?? 'vendible']);
                }

            }
            $rma->update(['status' => $status, 'admin_notes' => $notes]);
            if ($status === 'processed' && in_array($rma->type,['return','exchange'],true)) {
                $order = $rma->pedido()->lockForUpdate()->firstOrFail();
                $gross = (float)$order->items->sum(fn($line)=>$line->precio_unitario*$line->cantidad);
                $returnedGross = DB::table('rma_items as r')->join('rma_requests as h','h.id','=','r.rma_request_id')->join('pedido_item as i','i.id','=','r.pedido_item_id')
                    ->where('h.pedido_id',$order->id)->where('h.status','processed')->whereIn('h.type',['return','exchange'])->sum(DB::raw('r.cantidad * i.precio_unitario'));
                if ($gross > 0) \App\Services\Orders\OrderLoyaltyService::restoreRedeemed($order,(int)floor($order->puntos_usados*$returnedGross/$gross));
            }

            return $rma;
        });
    }
}
