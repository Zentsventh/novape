<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ErpDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Zonas
        DB::table('zonas')->insert([
            ['nombre' => 'Lima Metropolitana', 'costo_envio' => 10.00, 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Callao', 'costo_envio' => 15.00, 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Provincias Central', 'costo_envio' => 25.00, 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Provincias Norte/Sur', 'costo_envio' => 30.00, 'activo' => true, 'created_at' => Carbon::now()],
        ]);

        // 2. Métodos de Pago
        DB::table('metodos_pago')->insert([
            ['nombre' => 'Yape / Plin', 'detalles' => 'Pago rápido por billetera digital', 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Tarjeta de Crédito', 'detalles' => 'Pago seguro vía pasarela', 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Transferencia Bancaria', 'detalles' => 'BCP, BBVA, Interbank', 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Efectivo contra entrega', 'detalles' => 'Pago al repartidor', 'activo' => true, 'created_at' => Carbon::now()],
        ]);

        // 3. Almacenes
        DB::table('almacenes')->insert([
            ['nombre' => 'Almacén Central Lima', 'direccion' => 'Av. Principal 123, Surco', 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Almacén Norte', 'direccion' => 'Parque Industrial, Los Olivos', 'activo' => true, 'created_at' => Carbon::now()],
            ['nombre' => 'Tienda Principal', 'direccion' => 'Centro Comercial, Miraflores', 'activo' => true, 'created_at' => Carbon::now()],
        ]);

        // 4. Compras (simuladas)
        DB::table('compras')->insert([
            ['proveedor_id' => 1, 'total' => 2500.50, 'estado' => 'completado', 'fecha_compra' => Carbon::now()->subDays(5), 'created_at' => Carbon::now()],
            ['proveedor_id' => 1, 'total' => 8400.00, 'estado' => 'pendiente', 'fecha_compra' => Carbon::now()->subDays(2), 'created_at' => Carbon::now()],
            ['proveedor_id' => 2, 'total' => 1250.00, 'estado' => 'completado', 'fecha_compra' => Carbon::now()->subDays(10), 'created_at' => Carbon::now()],
        ]);

        // 5. Gastos (semilla para el módulo que ya creamos)
        DB::table('gastos')->insert([
            ['concepto' => 'Pago de Luz - Local Principal', 'monto' => 350.00, 'categoria' => 'Operativo', 'fecha_gasto' => Carbon::now()->subDays(3), 'created_at' => Carbon::now()],
            ['concepto' => 'Pago de Agua', 'monto' => 85.50, 'categoria' => 'Operativo', 'fecha_gasto' => Carbon::now()->subDays(4), 'created_at' => Carbon::now()],
            ['concepto' => 'Sueldo Administrador', 'monto' => 2500.00, 'categoria' => 'Planilla', 'fecha_gasto' => Carbon::now()->startOfMonth(), 'created_at' => Carbon::now()],
            ['concepto' => 'Publicidad Facebook Ads', 'monto' => 500.00, 'categoria' => 'Marketing', 'fecha_gasto' => Carbon::now()->subDays(1), 'created_at' => Carbon::now()],
        ]);
    }
}
