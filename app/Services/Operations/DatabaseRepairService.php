<?php

declare(strict_types=1);
namespace App\Services\Operations;

use Illuminate\Support\Facades\DB;

final class DatabaseRepairService
{
    public function reconcileRecordedStock(): array
    {
        return DB::transaction(function () {
            $journalCorrections = 0; $cacheCorrections = 0;
            // Same lock order as inventory writers. Stock records are the recorded
            // baseline; this operation does not certify a physical warehouse count.
            foreach (DB::table('variante')->orderBy('id')->pluck('id') as $variantId) {
                $variant = DB::table('variante')->where('id', $variantId)->lockForUpdate()->first();
                $stocks = DB::table('stock_almacen')->where('variante_id', $variantId)->orderBy('almacen_id')->lockForUpdate()->get();
                foreach ($stocks as $stock) {
                    $balance = (int) DB::table('inventario_movimientos')->where('variante_id', $variantId)->where('almacen_id', $stock->almacen_id)->sum('cantidad');
                    $delta = (int) $stock->cantidad - $balance;
                    if (!$delta) continue;
                    $key = 'recorded-reconciliation:'.$stock->id.':'.$balance.':'.$stock->cantidad;
                    DB::table('inventario_movimientos')->insert([
                        'variante_id'=>$variantId,'almacen_id'=>$stock->almacen_id,'usuario_id'=>null,
                        'tipo'=>'conciliacion','cantidad'=>$delta,'stock_anterior'=>$balance,'stock_nuevo'=>$stock->cantidad,
                        'motivo'=>'Conciliación con stock registrado; no certifica conteo físico ni reconstruye movimientos históricos',
                        'operation_key'=>$key,'referencia_tipo'=>'database_repair','referencia_id'=>$stock->id,
                        'created_at'=>now(),'updated_at'=>now(),
                    ]);
                    $this->record($key, 'recorded_inventory_reconciliation', ['stock_id'=>$stock->id,'previous_journal_balance'=>$balance,'recorded_balance'=>(int)$stock->cantidad,'physical_count_verified'=>false]);
                    $journalCorrections++;
                }
                $total = (int) $stocks->sum('cantidad');
                if ((int) $variant->stock !== $total) {
                    $this->record('variant-cache:'.$variantId.':'.$variant->stock.':'.$total, 'derived_stock_cache', ['variant_id'=>$variantId,'previous_stock'=>(int)$variant->stock,'warehouse_sum'=>$total]);
                    DB::table('variante')->where('id', $variantId)->update(['stock'=>$total,'updated_at'=>now()]);
                    $cacheCorrections++;
                }
            }
            return ['journal_corrections'=>$journalCorrections,'derived_cache_corrections'=>$cacheCorrections,'physical_count_verified'=>false];
        });
    }

    private function record(string $key, string $kind, array $details): void
    {
        DB::table('database_repair_events')->insertOrIgnore(['operation_key'=>$key,'kind'=>$kind,'details'=>json_encode($details, JSON_THROW_ON_ERROR),'created_at'=>now()]);
    }
}
