<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Producto;
use App\Models\Usuario;
use App\Models\Pedido;

class PanelDemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Sembrando datos demo para el panel de control (Módulos vacíos)...');

        $faker = \Faker\Factory::create('es_PE');

        $usuario = Usuario::first();
        $producto = Producto::first();
        $pedido = Pedido::first();
        
        $userId = $usuario ? $usuario->id : 1;
        $productoId = $producto ? $producto->id : 1;
        $pedidoId = $pedido ? $pedido->id : 1;

        // 1. Libro de Reclamaciones (Reclamos)
        if (DB::table('reclamos')->count() == 0) {
            for ($i = 0; $i < 10; $i++) {
                DB::table('reclamos')->insert([
                    'codigo' => 'REC-2026-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'nombres' => $faker->firstName,
                    'apellidos' => $faker->lastName,
                    'email' => $faker->unique()->safeEmail,
                    'telefono' => $faker->phoneNumber,
                    'tipo_documento' => 'DNI',
                    'numero_documento' => $faker->numerify('########'),
                    'tipo_reclamo' => $faker->randomElement(['Reclamo', 'Queja']),
                    'detalle' => $faker->paragraph,
                    'estado' => $faker->randomElement(['Pendiente', 'En proceso', 'Resuelto']),
                    'created_at' => now()->subDays(rand(1, 60)),
                    'updated_at' => now(),
                ]);
            }
        }

        // 2. Opiniones / Reseñas
        if (DB::table('resenas')->count() == 0 && $producto) {
            for ($i = 0; $i < 20; $i++) {
                DB::table('resenas')->insert([
                    'producto_id' => $productoId,
                    'usuario_id' => $userId,
                    'calificacion' => rand(3, 5),
                    'comentario' => $faker->realText(100),
                    'aprobado' => rand(0, 1) == 1,
                    'created_at' => now()->subDays(rand(1, 60)),
                    'updated_at' => now(),
                ]);
            }
        }

        // 3. Promociones
        if (DB::table('promociones')->count() == 0) {
            DB::table('promociones')->insert([
                'nombre' => 'Black Friday 2026',
                'tipo_descuento' => 'porcentaje',
                'valor_descuento' => 50,
                'fecha_inicio' => now()->addDays(10),
                'fecha_fin' => now()->addDays(20),
                'activa' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. Marcas (brands) if they exist
        if (DB::getSchemaBuilder()->hasTable('brands') && DB::table('brands')->count() == 0) {
            $marcas = ['Samsung', 'LG', 'Sony', 'Philips', 'Mabe'];
            foreach ($marcas as $marca) {
                DB::table('brands')->insert([
                    'name' => $marca,
                    'slug' => \Illuminate\Support\Str::slug($marca),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 5. Categorias if empty
        if (DB::getSchemaBuilder()->hasTable('categories') && DB::table('categories')->count() == 0) {
            $categorias = ['Televisores', 'Línea Blanca', 'Audio', 'Cómputo', 'Celulares'];
            foreach ($categorias as $cat) {
                DB::table('categories')->insert([
                    'name' => $cat,
                    'slug' => \Illuminate\Support\Str::slug($cat),
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 6. Cajas y Movimientos
        if (DB::getSchemaBuilder()->hasTable('cajas') && DB::table('cajas')->count() == 0) {
            $cajaId = DB::table('cajas')->insertGetId([
                'nombre' => 'Caja Principal',
                'sucursal_id' => null,
                'estado' => 'abierta',
                'saldo_inicial' => 1000.00,
                'saldo_actual' => 1500.00,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (DB::getSchemaBuilder()->hasTable('caja_movimientos')) {
                DB::table('caja_movimientos')->insert([
                    'caja_sesion_id' => $cajaId,
                    'usuario_id' => $userId,
                    'tipo' => 'ingreso',
                    'monto' => 500.00,
                    'concepto' => 'Venta en efectivo',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // 7. Proveedores
        if (DB::getSchemaBuilder()->hasTable('proveedor') && DB::table('proveedor')->count() == 0) {
            DB::table('proveedor')->insert([
                'ruc' => '20123456789',
                'razon_social' => 'Distribuidora Tecnológica S.A.C.',
                'email' => 'ventas@distribuidora.pe',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 8. CRM Companies
        if (DB::getSchemaBuilder()->hasTable('crm_companies') && DB::table('crm_companies')->count() == 0) {
            DB::table('crm_companies')->insert([
                'name' => 'Empresa de Prueba S.R.L.',
                'email' => 'contacto@empresa.com',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        $this->command->info('Datos semilla generados.');
    }
}
