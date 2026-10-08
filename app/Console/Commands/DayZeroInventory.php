<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DayZeroInventory extends Command
{
    protected $signature = 'inventory:day-zero';
    protected $description = 'Applies a Day 0 physical inventory, resetting negative stocks and balancing the Kardex.';

    public function handle()
    {
        $this->info('Starting Day 0 Inventory Reconciliation...');

        // 1. Ensure stock_almacen has no negative quantities
        $this->info('Fixing negative stocks in stock_almacen...');
        DB::table('stock_almacen')->where('cantidad', '<', 0)->update(['cantidad' => 0]);

        // 2. Sync variante total stock with stock_almacen
        $this->info('Syncing variante totals...');
        $sqlVariants = "
            SELECT v.id as variante_id, v.stock as current_variant_stock,
                   COALESCE(SUM(sa.cantidad), 0) as total_warehouse_stock
            FROM variante v
            LEFT JOIN stock_almacen sa ON v.id = sa.variante_id
            GROUP BY v.id, v.stock
            HAVING current_variant_stock != total_warehouse_stock
        ";
        $discrepanciesVariants = DB::select($sqlVariants);
        foreach ($discrepanciesVariants as $row) {
            DB::table('variante')->where('id', $row->variante_id)->update(['stock' => $row->total_warehouse_stock]);
        }

        // 3. Balance Kardex (inventario_movimientos)
        $this->info('Balancing Kardex (inventario_movimientos)...');
        
        $sqlKardex = "
            SELECT sa.id as stock_almacen_id, sa.variante_id, sa.almacen_id, sa.cantidad as physical_stock,
                   COALESCE(SUM(im.cantidad), 0) as kardex_stock
            FROM stock_almacen sa
            LEFT JOIN inventario_movimientos im ON sa.variante_id = im.variante_id AND sa.almacen_id = im.almacen_id
            GROUP BY sa.id, sa.variante_id, sa.almacen_id, sa.cantidad
            HAVING physical_stock != kardex_stock
        ";
        
        $discrepanciesKardex = DB::select($sqlKardex);
        
        // We need to bypass the trigger for this specific administrative action, or use the trigger correctly if it allows 'apertura'.
        // Wait, the trigger blocks UPDATE and DELETE. INSERT is allowed!
        // We just need to INSERT a corrective movement.
        
        foreach ($discrepanciesKardex as $row) {
            $diff = $row->physical_stock - $row->kardex_stock;
            
            DB::table('inventario_movimientos')->insert([
                'variante_id' => $row->variante_id,
                'almacen_id' => $row->almacen_id,
                'cantidad' => $diff,
                'stock_anterior' => $row->kardex_stock,
                'stock_nuevo' => $row->physical_stock,
                'tipo' => 'apertura',
                'motivo' => 'Inventario Físico Inicial (Día 0)',
                'referencia_tipo' => 'DAY0',
                'referencia_id' => 0,
                'created_at' => now(),
                'updated_at' => now(),
                'usuario_id' => null,
                'operation_key' => 'day0_' . uniqid() . '_' . $row->variante_id . '_' . $row->almacen_id
            ]);
        }

        $this->info('Day 0 Inventory successfully established.');
        return Command::SUCCESS;
    }
}

