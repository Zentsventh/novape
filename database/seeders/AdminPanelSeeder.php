<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminPanelSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================
        // 1. Limpiar datos basura (pedidos sin usuario válido)
        // ============================================
        $this->command->info('Limpiando datos inconsistentes...');
        
        // Eliminar pedido_items de pedidos huérfanos
        $pedidosHuerfanos = DB::table('pedido')
            ->leftJoin('usuario', 'pedido.usuario_id', '=', 'usuario.id')
            ->whereNull('usuario.id')
            ->pluck('pedido.id');
        
        if ($pedidosHuerfanos->count() > 0) {
            DB::table('pedido_item')->whereIn('pedido_id', $pedidosHuerfanos)->delete();
            DB::table('pedido')->whereIn('id', $pedidosHuerfanos)->delete();
            $this->command->info("Eliminados {$pedidosHuerfanos->count()} pedidos huérfanos.");
        }

        // También eliminar pedidos de usuarios soft-deleted
        $deletedUsers = DB::table('usuario')->whereNotNull('deleted_at')->pluck('id');
        if ($deletedUsers->count() > 0) {
            $pedidosDeleted = DB::table('pedido')->whereIn('usuario_id', $deletedUsers)->pluck('id');
            if ($pedidosDeleted->count() > 0) {
                DB::table('pedido_item')->whereIn('pedido_id', $pedidosDeleted)->delete();
                DB::table('pedido')->whereIn('id', $pedidosDeleted)->delete();
                $this->command->info("Eliminados pedidos de usuarios eliminados.");
            }
        }

        // ============================================
        // 2. Desbloquear Admin Root si estaba bloqueado
        // ============================================
        DB::table('usuario')->where('id', 1)->update(['estado' => 'activo']);
        $this->command->info('Admin Root desbloqueado.');

        // ============================================
        // 3. Crear 5 clientes realistas peruanos
        // ============================================
        $this->command->info('Creando clientes de ejemplo...');

        $clientes = [
            [
                'nombres' => 'Camila',
                'apellidos' => 'Torres Huaman',
                'email' => 'camila.torres@gmail.com',
                'password_hash' => Hash::make('Novape2026!'),
                'dni' => '72345678',
                'telefono' => '987654321',
                'estado' => 'activo',
                'created_at' => Carbon::now()->subDays(45),
                'updated_at' => Carbon::now()->subDays(45),
            ],
            [
                'nombres' => 'Diego',
                'apellidos' => 'Quispe Mendoza',
                'email' => 'diego.quispe@hotmail.com',
                'password_hash' => Hash::make('Novape2026!'),
                'dni' => '81234567',
                'telefono' => '912345678',
                'estado' => 'activo',
                'created_at' => Carbon::now()->subDays(30),
                'updated_at' => Carbon::now()->subDays(30),
            ],
            [
                'nombres' => 'Valentina',
                'apellidos' => 'Rojas Paredes',
                'email' => 'vale.rojas@outlook.com',
                'password_hash' => Hash::make('Novape2026!'),
                'dni' => '65432198',
                'telefono' => '945678123',
                'estado' => 'activo',
                'created_at' => Carbon::now()->subDays(20),
                'updated_at' => Carbon::now()->subDays(20),
            ],
            [
                'nombres' => 'Sebastián',
                'apellidos' => 'Vargas Espinoza',
                'email' => 'svargas@gmail.com',
                'password_hash' => Hash::make('Novape2026!'),
                'dni' => '43218765',
                'telefono' => '956781234',
                'estado' => 'bloqueado',
                'created_at' => Carbon::now()->subDays(60),
                'updated_at' => Carbon::now()->subDays(5),
            ],
            [
                'nombres' => 'Isabella',
                'apellidos' => 'Fernández Cruz',
                'email' => 'isa.fernandez@yahoo.com',
                'password_hash' => Hash::make('Novape2026!'),
                'dni' => '56781234',
                'telefono' => '923456789',
                'estado' => 'activo',
                'created_at' => Carbon::now()->subDays(10),
                'updated_at' => Carbon::now()->subDays(10),
            ],
        ];

        $clienteIds = [];
        foreach ($clientes as $cliente) {
            // Verificar si ya existe por email
            $exists = DB::table('usuario')->where('email', $cliente['email'])->first();
            if ($exists) {
                $clienteIds[] = $exists->id;
                continue;
            }
            $clienteIds[] = DB::table('usuario')->insertGetId($cliente);
        }

        $this->command->info('5 clientes creados.');

        // ============================================
        // 4. Obtener productos existentes para los pedidos
        // ============================================
        $variantes = DB::table('variante')
            ->join('producto', 'variante.producto_id', '=', 'producto.id')
            ->select('variante.id', 'variante.producto_id', 'variante.precio', 'variante.stock', 'producto.nombre')
            ->where('variante.stock', '>', 0)
            ->limit(10)
            ->get();

        if ($variantes->isEmpty()) {
            $this->command->warn('No hay variantes con stock. Saltando creación de pedidos.');
            return;
        }

        // ============================================
        // 5. Crear pedidos variados para los clientes
        // ============================================
        $this->command->info('Creando pedidos de ejemplo...');

        $estados = ['pendiente', 'pagado', 'enviado', 'completado', 'cancelado'];
        $pedidoIds = [];

        foreach ($clienteIds as $i => $clienteId) {
            $estado = $estados[$i % count($estados)];
            $numItems = rand(1, min(3, $variantes->count()));
            $selectedVariantes = $variantes->random($numItems);

            $subtotal = 0;
            $items = [];
            foreach ($selectedVariantes as $v) {
                $cantidad = rand(1, 3);
                $precioUnit = (float) $v->precio;
                $subtotal += $precioUnit * $cantidad;

                $items[] = [
                    'variante_id' => $v->id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precioUnit,
                ];
            }

            $costoEnvio = $subtotal > 500 ? 0 : 15.00;
            $total = $subtotal + $costoEnvio;

            $codigo = 'PED-' . strtoupper(substr(md5(uniqid()), 0, 8));

            $pedidoId = DB::table('pedido')->insertGetId([
                'usuario_id' => $clienteId,
                'codigo' => $codigo,
                'subtotal' => round($subtotal, 2),
                'descuento' => 0,
                'costo_envio' => $costoEnvio,
                'total' => round($total, 2),
                'estado' => $estado,
                'created_at' => Carbon::now()->subDays(rand(1, 30)),
                'updated_at' => Carbon::now()->subDays(rand(0, 5)),
            ]);

            $pedidoIds[] = $pedidoId;

            foreach ($items as $item) {
                DB::table('pedido_item')->insert([
                    'pedido_id' => $pedidoId,
                    'variante_id' => $item['variante_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info(count($pedidoIds) . ' pedidos creados.');

        // ============================================
        // 6. Crear notas CRM para 2 clientes
        // ============================================
        $this->command->info('Creando notas CRM de ejemplo...');

        $adminId = DB::table('usuario_rol')->where('rol_id', 1)->value('usuario_id') ?? 2;

        $notasSeed = [
            [
                'cliente_id' => $clienteIds[0],
                'autor_id' => $adminId,
                'nota' => 'Cliente llamó preguntando por disponibilidad de laptops HP. Se le ofreció el modelo Pavilion con descuento del 10%.',
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'cliente_id' => $clienteIds[0],
                'autor_id' => $adminId,
                'nota' => 'Enviar correo de seguimiento. La clienta indicó que está comparando precios con la competencia.',
                'created_at' => Carbon::now()->subDays(1),
                'updated_at' => Carbon::now()->subDays(1),
            ],
            [
                'cliente_id' => $clienteIds[1],
                'autor_id' => $adminId,
                'nota' => 'Cliente solicitó factura electrónica por su compra. Se le envió al correo electrónico registrado.',
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
            [
                'cliente_id' => $clienteIds[3],
                'autor_id' => $adminId,
                'nota' => 'Cuenta bloqueada por solicitud repetida de devoluciones sin justificación. Revisar en 30 días.',
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
        ];

        foreach ($notasSeed as $nota) {
            DB::table('cliente_notas')->insert($nota);
        }

        $this->command->info('4 notas CRM creadas.');

        // ============================================
        // 7. Crear logs de actividad reciente
        // ============================================
        $this->command->info('Creando logs de actividad...');

        $actividades = [
            ['accion' => 'Creó un nuevo cliente', 'modelo' => 'usuario'],
            ['accion' => 'Actualizó estado de pedido a Enviado', 'modelo' => 'pedido'],
            ['accion' => 'Bloqueó una cuenta de usuario', 'modelo' => 'usuario'],
            ['accion' => 'Restableció contraseña de usuario', 'modelo' => 'usuario'],
            ['accion' => 'Añadió una nota al cliente', 'modelo' => 'usuario'],
        ];

        foreach ($actividades as $j => $act) {
            DB::table('actividad_logs')->insert([
                'user_id' => $adminId,
                'accion' => $act['accion'],
                'modelo' => $act['modelo'],
                'modelo_id' => $clienteIds[$j % count($clienteIds)],
                'detalles' => null,
                'created_at' => Carbon::now()->subHours(rand(1, 48)),
                'updated_at' => Carbon::now()->subHours(rand(1, 48)),
            ]);
        }

        $this->command->info('Logs de actividad creados.');
        $this->command->info('✅ AdminPanelSeeder completado exitosamente.');
    }
}
