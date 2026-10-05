<?php

declare(strict_types=1);

namespace App\Services\Inventory;

use App\Models\PedidoItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ReturnLedger
{
    // Requires a locked order. Both cancellation and RMA use the same ledger.
    public function restore(PedidoItem $item, int $quantity, string $operation, int $warehouse, int $actor, string $reason, bool $restock = true): void
    {
        if (DB::table('inventory_returns')->where('operation_key', $operation)->exists()) {
            return;
        }
        $returned = (int) DB::table('inventory_returns')->where('pedido_item_id', $item->id)->sum('cantidad');
        if ($quantity < 1 || $returned + $quantity > $item->cantidad) {
            throw ValidationException::withMessages(['items' => 'La cantidad devuelta excede lo vendido o ya fue restituida.']);
        }
        $variant = DB::table('variante')->where('id', $item->variante_id)->lockForUpdate()->first();
        if (! $variant) {
            throw ValidationException::withMessages(['items' => 'No se encontró la variante original.']);
        }
        if ($restock) {
            $stock = DB::table('stock_almacen')->where('almacen_id', $warehouse)->where('variante_id', $item->variante_id)->lockForUpdate()->first();
            if ($stock) {
                DB::table('stock_almacen')->where('id', $stock->id)->increment('cantidad', $quantity);
            } else {
                DB::table('stock_almacen')->insert(['almacen_id' => $warehouse, 'variante_id' => $item->variante_id, 'cantidad' => $quantity, 'created_at' => now(), 'updated_at' => now()]);
            }
            DB::statement('UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?', [$item->variante_id, $item->variante_id]);
            DB::table('movimientos_almacen')->insert(['almacen_id' => $warehouse, 'variante_id' => $item->variante_id, 'tipo' => 'entrada', 'cantidad' => $quantity, 'referencia' => $reason, 'usuario_id' => $actor ?: null, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('inventory_returns')->insert(['pedido_item_id' => $item->id, 'operation_key' => $operation, 'cantidad' => $quantity, 'restocked' => $restock, 'almacen_id' => $warehouse, 'usuario_id' => $actor ?: null, 'created_at' => now(), 'updated_at' => now()]);
    }
}
