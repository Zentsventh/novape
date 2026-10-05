<?php

declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

use App\Models\RmaRequest;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RmaProcessingService
{
    public function __construct(private readonly InventoryService $inventoryService) {}

    public function updateStatus(int $id, string $status, ?string $notes, int $userId): RmaRequest
    {
        return DB::transaction(function () use ($id, $status, $notes, $userId) {
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
                if ($pedido->estado === 'cancelado') {
                    throw ValidationException::withMessages(['status' => 'El pedido cancelado ya tiene su inventario restituido.']);
                }
                $overlap = RmaRequest::where('pedido_id', $pedido->id)->where('id', '!=', $rma->id)
                    ->where('type', 'return')->where('status', 'processed');
                if ($rma->producto_id) {
                    $overlap->where(fn ($q) => $q->whereNull('producto_id')->orWhere('producto_id', $rma->producto_id));
                }
                if ($overlap->exists()) {
                    throw ValidationException::withMessages(['status' => 'Estos productos ya se devolvieron en otra solicitud.']);
                }
                $pedido->load('items.variante');
                $items = $pedido->items->filter(fn ($item) => $item->variante &&
                    (! $rma->producto_id || $item->variante->producto_id == $rma->producto_id));
                if ($items->isEmpty()) {
                    throw ValidationException::withMessages(['status' => 'La devolución no contiene artículos del pedido.']);
                }
                $pedido->setRelation('items', $items);
                $this->inventoryService->returnStockForOrder($pedido, $userId, 'Devolución RMA '.$rma->id);
            }
            $rma->update(['status' => $status, 'admin_notes' => $notes]);

            return $rma;
        });
    }
}
