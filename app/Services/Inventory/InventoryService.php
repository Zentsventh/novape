<?php

declare(strict_types=1);

namespace App\Services\Inventory;

use App\Models\ConfiguracionSitio;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Restores stock for all items in a given order.
     * Must be called within a database transaction.
     */
    public function returnStockForOrder(Pedido $pedido, int $usuarioId = 1, string $motivo = 'Cancelación/Reembolso'): void
    {
        foreach ($pedido->items->sortBy('variante_id') as $item) {
            $returned = (int) DB::table('inventory_returns')->where('pedido_item_id', $item->id)->sum('cantidad');
            $remaining = (int) $item->cantidad - $returned;
            if ($remaining > 0) {
                app(ReturnLedger::class)->restore($item, $remaining, 'cancel:'.$pedido->id.':'.$item->id,
                    (int) ($item->almacen_id ?: ConfiguracionSitio::obtener('almacen_ecommerce_id', 1)), $usuarioId, $motivo.' Pedido '.$pedido->codigo);
            }
        }

    }
}
