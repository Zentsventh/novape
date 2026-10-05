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
            if ($rma->status !== $status && $status === 'processed' && $rma->type === 'return') {
                $pedido = $rma->pedido()->lockForUpdate()->firstOrFail();
                if (strtolower($pedido->estado) === 'cancelado' || ! $pedido->stock_consumed_at) {
                    throw ValidationException::withMessages(['status' => 'El pedido cancelado ya tiene su inventario restituido.']);
                }
                $pedido->load('items.variante');
                $eligible = $pedido->items->filter(fn ($item) => $item->variante && (! $rma->producto_id || $item->variante->producto_id == $rma->producto_id));
                if ($eligible->isEmpty()) {
                    throw ValidationException::withMessages(['items' => 'La devolución no contiene artículos del pedido.']);
                }
                $saved = $rma->items()->get();
                $lines ??= $saved->isNotEmpty() ? $saved->toArray() : [];
                if (! $lines || count(array_column($lines, 'pedido_item_id')) !== count(array_unique(array_column($lines, 'pedido_item_id')))) {
                    throw ValidationException::withMessages(['items' => 'Selecciona líneas únicas y cantidades positivas.']);
                }
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

            return $rma;
        });
    }
}
