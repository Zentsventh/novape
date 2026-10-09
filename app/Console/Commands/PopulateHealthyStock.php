<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class PopulateHealthyStock extends Command
{
    protected $signature = 'inventory:populate-healthy-stock';
    protected $description = 'Populates realistic physical stock across warehouses and balances Kardex with full audit integrity.';

    public function handle()
    {
        $this->info('Iniciando asignacion de stock saludable a todos los productos...');

        // 1. Obtener almacenes activos
        $almacenes = DB::table('almacenes')->where('activo', 1)->pluck('id')->toArray();
        if (empty($almacenes)) {
            $this->error('No hay almacenes activos.');
            return 1;
        }

        $ecomWarehouseId = (int) (DB::table('configuracion_sitio')->where('clave', 'almacen_ecommerce_id')->value('valor') ?: 3);
        if (!in_array($ecomWarehouseId, $almacenes)) {
            $ecomWarehouseId = $almacenes[0];
            DB::table('configuracion_sitio')->updateOrInsert(['clave' => 'almacen_ecommerce_id'], ['valor' => $ecomWarehouseId]);
        }
        $this->info("Almacen principal e-commerce: ID {$ecomWarehouseId}");

        // 2. Procesar variantes
        $variants = DB::table('variante')->select('id', 'precio', 'stock_minimo', 'stock_maximo')->get();
        $this->info("Total de variantes a procesar: {$variants->count()}");

        $now = now();
        $batchSize = 250;
        $kardexInserts = [];
        $legacyInserts = [];

        // Pre-cargar stocks existentes en kardex y stock_almacen
        $existingStocks = DB::table('stock_almacen')
            ->select('variante_id', 'almacen_id', 'cantidad')
            ->get()
            ->keyBy(fn($r) => "{$r->variante_id}_{$r->almacen_id}");

        $kardexSums = DB::table('inventario_movimientos')
            ->selectRaw('variante_id, almacen_id, SUM(cantidad) as total')
            ->groupBy('variante_id', 'almacen_id')
            ->get()
            ->keyBy(fn($r) => "{$r->variante_id}_{$r->almacen_id}");

        $legacySums = DB::table('movimientos_almacen')
            ->selectRaw("variante_id, almacen_id, SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -ABS(cantidad) END) as total")
            ->groupBy('variante_id', 'almacen_id')
            ->get()
            ->keyBy(fn($r) => "{$r->variante_id}_{$r->almacen_id}");

        $totalProcessed = 0;

        foreach ($variants as $variant) {
            $totalVariantStock = 0;

            foreach ($almacenes as $almacenId) {
                $key = "{$variant->id}_{$almacenId}";
                $currentStock = $existingStocks->get($key)?->cantidad ?? 0;

                // Asignar stock saludable y realista
                if ($currentStock <= 0) {
                    if ($almacenId == $ecomWarehouseId) {
                        // Almacen central ecommerce: entre 18 y 45 unidades
                        $desiredStock = 18 + (($variant->id * 11) % 28);
                    } else {
                        // Tienda física / retiro en tienda: entre 6 y 22 unidades
                        $desiredStock = 6 + (($variant->id * 7) % 17);
                    }
                } else {
                    $desiredStock = $currentStock;
                }

                $totalVariantStock += $desiredStock;

                // Actualizar o insertar en stock_almacen
                DB::table('stock_almacen')->updateOrInsert(
                    ['variante_id' => $variant->id, 'almacen_id' => $almacenId],
                    ['cantidad' => $desiredStock, 'updated_at' => $now]
                );

                // Calcular diferencia para Kardex (inventario_movimientos)
                $currentKardex = (int) ($kardexSums->get($key)?->total ?? 0);
                $kardexDiff = $desiredStock - $currentKardex;

                if ($kardexDiff != 0) {
                    $kardexInserts[] = [
                        'variante_id' => $variant->id,
                        'almacen_id' => $almacenId,
                        'cantidad' => $kardexDiff,
                        'stock_anterior' => $currentKardex,
                        'stock_nuevo' => $desiredStock,
                        'costo_unitario' => round((float)$variant->precio * 0.65, 4),
                        'tipo' => 'apertura',
                        'motivo' => 'Inventario Inicial Fisico (Apertura)',
                        'referencia_tipo' => 'APERTURA',
                        'referencia_id' => 0,
                        'usuario_id' => null,
                        'operation_key' => 'init_' . $variant->id . '_' . $almacenId . '_' . uniqid(),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                // Calcular diferencia para movimientos_almacen
                $currentLegacy = (int) ($legacySums->get($key)?->total ?? 0);
                $legacyDiff = $desiredStock - $currentLegacy;

                if ($legacyDiff > 0) {
                    $legacyInserts[] = [
                        'almacen_id' => $almacenId,
                        'variante_id' => $variant->id,
                        'tipo' => 'entrada',
                        'cantidad' => $legacyDiff,
                        'referencia' => 'Apertura de inventario inicial',
                        'usuario_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                } elseif ($legacyDiff < 0) {
                    $legacyInserts[] = [
                        'almacen_id' => $almacenId,
                        'variante_id' => $variant->id,
                        'tipo' => 'salida',
                        'cantidad' => abs($legacyDiff),
                        'referencia' => 'Ajuste de inventario inicial',
                        'usuario_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (count($kardexInserts) >= $batchSize) {
                    DB::table('inventario_movimientos')->insert($kardexInserts);
                    $kardexInserts = [];
                }
                if (count($legacyInserts) >= $batchSize) {
                    DB::table('movimientos_almacen')->insert($legacyInserts);
                    $legacyInserts = [];
                }
            }

            // Actualizar stock total en variante
            DB::table('variante')->where('id', $variant->id)->update(['stock' => $totalVariantStock]);

            $totalProcessed++;
        }

        if (!empty($kardexInserts)) {
            DB::table('inventario_movimientos')->insert($kardexInserts);
        }
        if (!empty($legacyInserts)) {
            DB::table('movimientos_almacen')->insert($legacyInserts);
        }

        $this->info("Stock asignado con exito a {$totalProcessed} variantes.");

        // 3. Limpiar reservas vencidas
        DB::table('reservas_stock')->where('expires_at', '<', $now)->delete();

        // 4. Limpiar cache
        Cache::flush();

        $this->info('Inventario saludable balanceado y caches limpiadas.');
        return 0;
    }
}

