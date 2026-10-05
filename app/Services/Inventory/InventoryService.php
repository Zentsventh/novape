<?php

declare(strict_types=1);

namespace App\Services\Inventory;

use App\Models\ConfiguracionSitio;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InventoryService
{
    /**
     * Restores stock for all items in a given order.
     * Must be called within a database transaction.
     */
    public function returnStockForOrder(Pedido $pedido, int $usuarioId = 1, string $motivo = 'Cancelación/Reembolso'): void
    {
        $almacenEcommerceId = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        $returnedProducts = Schema::hasTable('rma_requests')
            ? DB::table('rma_requests')->where('pedido_id', $pedido->id)->where('type', 'return')
                ->where('status', 'processed')->pluck('producto_id')
            : collect();

        foreach ($pedido->items as $item) {
            $variante = DB::table('variante')->where('id', $item->variante_id)->lockForUpdate()->first();
            if ($returnedProducts->contains(null) || ($variante && $returnedProducts->contains($variante->producto_id))) {
                continue;
            }
            $stockAlmacen = DB::table('stock_almacen')
                ->where('variante_id', $item->variante_id)
                ->where('almacen_id', $almacenEcommerceId)
                ->lockForUpdate()
                ->first();

            if ($stockAlmacen) {
                DB::table('stock_almacen')
                    ->where('id', $stockAlmacen->id)
                    ->increment('cantidad', $item->cantidad);
            } else {
                DB::table('stock_almacen')->insert([
                    'almacen_id' => $almacenEcommerceId,
                    'variante_id' => $item->variante_id,
                    'cantidad' => $item->cantidad,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Recalculate global variant stock
            DB::statement(
                'UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?',
                [$item->variante_id, $item->variante_id]
            );

            // Register Kardex movement
            DB::table('movimientos_almacen')->insert([
                'almacen_id' => $almacenEcommerceId,
                'variante_id' => $item->variante_id,
                'tipo' => 'entrada',
                'cantidad' => $item->cantidad,
                'referencia' => $motivo.' Pedido '.$pedido->codigo,
                'usuario_id' => $usuarioId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
