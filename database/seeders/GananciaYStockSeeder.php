<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GananciaYStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Inyectar Ventas Grandes para asegurar Ganancia Neta POSITIVA
        $cajeroId = DB::table('usuario')->first()?->id ?? 1;
        
        $ventasGrandes = [
            ['sub' => 450.00, 'igv' => 81.00, 'total' => 531.00],
            ['sub' => 200.00, 'igv' => 36.00, 'total' => 236.00]
        ];

        foreach ($ventasGrandes as $i => $v) {
            DB::table('ventas_pos')->insert([
                'codigo_ticket' => 'POS-BIG-' . date('Ymd') . '-' . rand(100, 999),
                'cajero_id' => $cajeroId,
                'metodo_pago_id' => 1,
                'subtotal' => $v['sub'],
                'igv' => $v['igv'],
                'total' => $v['total'],
                'tipo_comprobante' => 'factura',
                'created_at' => clone $now,
                'updated_at' => clone $now,
            ]);
        }

        // 2. Alertas de Stock Bajo (Asegurar que algunos productos tengan stock < 5)
        $variantes = DB::table('variante')->inRandomOrder()->limit(5)->get();
        foreach ($variantes as $v) {
            DB::table('variante')
                ->where('id', $v->id)
                ->update(['stock' => rand(1, 4)]);
        }
        
        // También actualizar el stock_almacen si existe
        $stocksAlmacen = DB::table('stock_almacen')->inRandomOrder()->limit(5)->get();
        foreach ($stocksAlmacen as $sa) {
            DB::table('stock_almacen')
                ->where('id', $sa->id)
                ->update(['cantidad' => rand(1, 2)]);
        }
    }
}

