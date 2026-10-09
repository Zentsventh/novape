<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventarioDashboardSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Inflar el stock y establecer precios de compra en todos los productos
        $variantes = DB::table('variante')->get();
        foreach ($variantes as $variante) {
            $precio = (float) $variante->precio;
            // Precio de compra es aprox 60% del precio de venta
            $precioCompra = $precio * 0.6;
            
            DB::table('variante')->where('id', $variante->id)->update([
                'stock' => rand(10, 100),
                'stock_minimo' => rand(5, 10),
                'stock_maximo' => rand(100, 200),
                'stock_seguridad' => rand(10, 20),
                'precio_compra' => $precioCompra,
            ]);
        }

        $proveedor = DB::table('proveedor')->first();
        if (!$proveedor) return; // Si no hay proveedor, no podemos crear compras
        
        $cajero = DB::table('usuario')->first();
        $metodo = DB::table('metodos_pago')->first();

        // 2. Generar Compras (Entradas) - Simular 33,000 unidades en el mes aprox.
        // Haremos 5 compras grandes este mes
        for ($i = 0; $i < 5; $i++) {
            $fecha = Carbon::now()->subDays(rand(1, 28));
            
            $compraId = DB::table('compras')->insertGetId([
                'numero_orden' => 'OC-SEED-2026-'.rand(1000,9999),
                'proveedor_id' => $proveedor->id,
                'total' => 0, // se actualiza abajo
                'estado' => 'completado',
                'fecha_compra' => $fecha->toDateString(),
                'created_at' => $fecha,
                'updated_at' => $fecha,
            ]);

            $totalCompra = 0;
            // Añadir 10 items al azar
            for ($j = 0; $j < 10; $j++) {
                $var = $variantes->random();
                $qty = rand(10, 50);
                $costo = (float) $var->precio * 0.6;
                
                DB::table('compra_items')->insert([
                    'compra_id' => $compraId,
                    'producto_id' => $var->producto_id,
                    'variante_id' => $var->id,
                    'cantidad' => $qty,
                    'costo_unitario' => $costo,
                    'subtotal' => $qty * $costo,
                    'created_at' => $fecha,
                    'updated_at' => $fecha,
                ]);
                
                $totalCompra += ($qty * $costo);
            }
            DB::table('compras')->where('id', $compraId)->update(['total' => $totalCompra]);
        }

        // 3. Generar Ventas (Salidas) - Simular 44,000 unidades
        // Haremos ventas diarias en el último mes
        for ($i = 0; $i < 30; $i++) {
            $fecha = Carbon::now()->subDays($i);
            
            // 2 a 5 tickets por día
            $numTickets = rand(2, 5);
            for ($t = 0; $t < $numTickets; $t++) {
                $ventaId = DB::table('ventas_pos')->insertGetId([
                    'codigo_ticket' => 'TK-SD-'.uniqid().rand(10,99),
                    'cajero_id' => $cajero ? $cajero->id : null,
                    'metodo_pago_id' => $metodo ? $metodo->id : null,
                    'subtotal' => 0,
                    'total' => 0,
                    'created_at' => $fecha,
                    'updated_at' => $fecha,
                ]);
                
                $totalVenta = 0;
                // 3 a 8 items por ticket
                $numItems = rand(3, 8);
                for ($k = 0; $k < $numItems; $k++) {
                    $var = $variantes->random();
                    $qty = rand(1, 3);
                    $precio = (float) $var->precio;
                    
                    DB::table('venta_pos_items')->insert([
                        'venta_pos_id' => $ventaId,
                        'variante_id' => $var->id,
                        'producto_nombre' => 'Producto Dummy',
                        'cantidad' => $qty,
                        'precio_unitario' => $precio,
                        'subtotal' => $qty * $precio,
                        'created_at' => $fecha,
                        'updated_at' => $fecha,
                    ]);
                    $totalVenta += ($qty * $precio);
                }
                DB::table('ventas_pos')->where('id', $ventaId)->update(['subtotal' => $totalVenta, 'total' => $totalVenta]);
            }
        }
    }
}
