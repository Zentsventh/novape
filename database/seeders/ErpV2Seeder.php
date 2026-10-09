<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ErpV2Seeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // Actualizar zonas con descripciones
        DB::table('zonas')->where('nombre', 'Lima Metropolitana')->update(['descripcion' => 'Cobertura en todos los distritos de Lima']);
        DB::table('zonas')->where('nombre', 'Callao')->update(['descripcion' => 'Ventanilla, Bellavista, La Perla, Carmen de la Legua']);
        DB::table('zonas')->where('nombre', 'LIKE', '%Central%')->update(['descripcion' => 'Junín, Huancavelica, Ayacucho, Pasco']);
        DB::table('zonas')->where('nombre', 'LIKE', '%Norte%')->update(['descripcion' => 'Piura, Lambayeque, La Libertad, Tumbes, Ancash']);

        // Actualizar métodos de pago con tipo y comisión
        DB::table('metodos_pago')->where('nombre', 'LIKE', '%Yape%')->update(['tipo' => 'digital', 'comision_porcentaje' => 0.00]);
        DB::table('metodos_pago')->where('nombre', 'LIKE', '%Tarjeta%')->update(['tipo' => 'digital', 'comision_porcentaje' => 3.49]);
        DB::table('metodos_pago')->where('nombre', 'LIKE', '%Transferencia%')->update(['tipo' => 'transferencia', 'comision_porcentaje' => 0.00]);
        DB::table('metodos_pago')->where('nombre', 'LIKE', '%Efectivo%')->update(['tipo' => 'fisico', 'comision_porcentaje' => 0.00]);

        // Actualizar gastos con tipo fijo/variable
        DB::table('gastos')->where('categoria', 'Operativo')->update(['tipo' => 'fijo']);
        DB::table('gastos')->where('categoria', 'Planilla')->update(['tipo' => 'fijo']);
        DB::table('gastos')->where('categoria', 'Marketing')->update(['tipo' => 'variable']);

        // Compra items (detalle de las compras existentes)
        $compras = DB::table('compras')->get();
        foreach ($compras as $compra) {
            $productos = DB::table('producto')->inRandomOrder()->limit(3)->get();
            foreach ($productos as $prod) {
                $variante = DB::table('variante')->where('producto_id', $prod->id)->first();
                if ($variante) {
                    $cantidad = rand(2, 10);
                    $costoUnit = round($variante->precio * 0.6, 2); // Costo = 60% del precio de venta
                    DB::table('compra_items')->insert([
                        'compra_id' => $compra->id,
                        'producto_id' => $prod->id,
                        'variante_id' => $variante->id,
                        'cantidad' => $cantidad,
                        'costo_unitario' => $costoUnit,
                        'subtotal' => round($costoUnit * $cantidad, 2),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        // Actualizar el total de cada compra basado en sus items
        foreach ($compras as $compra) {
            $total = DB::table('compra_items')->where('compra_id', $compra->id)->sum('subtotal');
            DB::table('compras')->where('id', $compra->id)->update(['total' => $total]);
        }

        // Stock por almacén (distribuir stock de variantes entre almacenes)
        $almacenes = DB::table('almacenes')->get();
        $variantes = DB::table('variante')->where('stock', '>', 0)->get();
        foreach ($variantes as $variante) {
            $stockRestante = $variante->stock;
            foreach ($almacenes as $i => $almacen) {
                if ($i === count($almacenes) - 1) {
                    $asignar = $stockRestante; // Último almacén recibe el resto
                } else {
                    $asignar = intval($stockRestante * 0.5); // 50% al primero
                }
                if ($asignar > 0) {
                    DB::table('stock_almacen')->insertOrIgnore([
                        'almacen_id' => $almacen->id,
                        'variante_id' => $variante->id,
                        'cantidad' => $asignar,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
                $stockRestante -= $asignar;
            }
        }

        // Movimientos de almacén (Kardex seed)
        $primerAlmacen = DB::table('almacenes')->first();
        if ($primerAlmacen) {
            foreach ($variantes->take(5) as $v) {
                DB::table('movimientos_almacen')->insert([
                    'almacen_id' => $primerAlmacen->id,
                    'variante_id' => $v->id,
                    'tipo' => 'entrada',
                    'cantidad' => rand(5, 20),
                    'referencia' => 'Ingreso inicial de inventario',
                    'created_at' => $now->copy()->subDays(15),
                    'updated_at' => $now,
                ]);
            }
        }

        // Banners CMS
        DB::table('banners')->insert([
            [
                'titulo' => '🏆 Polla Mundialista 2026',
                'subtitulo' => 'Gana increíbles premios con cada compra',
                'imagen_url' => '/images/banners/mundialista.jpg',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 1,
                'activo' => true,
                'fecha_inicio' => '2026-06-01',
                'fecha_fin' => '2026-07-31',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'titulo' => '🚀 Envío Gratis Lima',
                'subtitulo' => 'En compras mayores a S/ 199',
                'imagen_url' => '/images/banners/envio-gratis.jpg',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 2,
                'activo' => true,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'titulo' => '📱 Nuevos Samsung Galaxy S25',
                'subtitulo' => 'Tecnología de punta a precios increíbles',
                'imagen_url' => '/images/banners/samsung.jpg',
                'enlace_url' => '/catalogo?marca=samsung',
                'posicion' => 'hero',
                'orden' => 3,
                'activo' => true,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        // Ventas POS de ejemplo
        $metodoEfectivo = DB::table('metodos_pago')->where('nombre', 'LIKE', '%Efectivo%')->first();
        $metodoYape = DB::table('metodos_pago')->where('nombre', 'LIKE', '%Yape%')->first();

        $ventasData = [
            ['codigo' => 'POS-' . date('Ymd') . '-001', 'metodo' => $metodoEfectivo?->id, 'sub' => 847.46, 'igv' => 152.54, 'total' => 1000.00, 'tipo' => 'boleta', 'dias' => 2],
            ['codigo' => 'POS-' . date('Ymd') . '-002', 'metodo' => $metodoYape?->id, 'sub' => 423.73, 'igv' => 76.27, 'total' => 500.00, 'tipo' => 'boleta', 'dias' => 1],
            ['codigo' => 'POS-' . date('Ymd') . '-003', 'metodo' => $metodoEfectivo?->id, 'sub' => 1271.19, 'igv' => 228.81, 'total' => 1500.00, 'tipo' => 'factura', 'dias' => 0],
        ];

        foreach ($ventasData as $vd) {
            $ventaId = DB::table('ventas_pos')->insertGetId([
                'codigo_ticket' => $vd['codigo'],
                'cajero_id' => DB::table('usuario')->first()?->id,
                'metodo_pago_id' => $vd['metodo'],
                'subtotal' => $vd['sub'],
                'igv' => $vd['igv'],
                'total' => $vd['total'],
                'tipo_comprobante' => $vd['tipo'],
                'created_at' => $now->copy()->subDays($vd['dias']),
                'updated_at' => $now,
            ]);

            // Agregar items aleatorios a cada venta POS
            $prodsRandom = DB::table('producto')->inRandomOrder()->limit(2)->get();
            foreach ($prodsRandom as $pr) {
                $var = DB::table('variante')->where('producto_id', $pr->id)->first();
                if ($var) {
                    DB::table('venta_pos_items')->insert([
                        'venta_pos_id' => $ventaId,
                        'variante_id' => $var->id,
                        'producto_nombre' => $pr->nombre,
                        'cantidad' => rand(1, 3),
                        'precio_unitario' => $var->precio,
                        'subtotal' => $var->precio * rand(1, 3),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }
}
