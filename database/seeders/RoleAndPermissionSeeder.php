<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Los datos de demostracion solo se pueden cargar en local o testing.');
        }

        $demoPassword = env('DEMO_SEED_PASSWORD');
        if (!is_string($demoPassword) || strlen($demoPassword) < 12) {
            throw new \RuntimeException('Configura DEMO_SEED_PASSWORD con al menos 12 caracteres.');
        }

        // 1. Limpiar datos (Opcional, pero util si se ejecuta varias veces)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('rol_permiso')->truncate();
        DB::table('usuario_rol')->truncate();
        DB::table('permiso')->truncate();
        DB::table('rol')->truncate();
        // Nota: Solo vaciamos usuarios específicos en vez de truncate para no romper otras cosas
        DB::table('usuario')->whereIn('email', ['admin@novape.com', 'cajero@novape.com', 'almacen@novape.com'])->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $now = Carbon::now();

        // 2. Crear Permisos (Profesional)
        $permisosList = [
            // Dashboard y Reportes
            ['nombre' => 'dashboard.ver', 'descripcion' => 'Ver panel de control principal'],
            ['nombre' => 'reportes.ventas', 'descripcion' => 'Ver reportes de ventas e ingresos'],
            ['nombre' => 'reportes.inventario', 'descripcion' => 'Ver reportes de stock y movimientos'],
            ['nombre' => 'reportes.clientes', 'descripcion' => 'Ver métricas de clientes'],
            
            // POS y Ventas
            ['nombre' => 'pos.vender', 'descripcion' => 'Realizar ventas en el POS'],
            ['nombre' => 'pos.reembolsar', 'descripcion' => 'Realizar reembolsos en el POS'],
            ['nombre' => 'pos.anular', 'descripcion' => 'Anular comprobantes o ventas'],
            ['nombre' => 'ventas.ver', 'descripcion' => 'Ver registro de ventas'],
            
            // Pedidos y Entregas
            ['nombre' => 'pedidos.ver', 'descripcion' => 'Ver listado de pedidos'],
            ['nombre' => 'pedidos.gestionar', 'descripcion' => 'Cambiar estados de pedidos (procesando, enviado, etc)'],
            
            // Inventario y Productos
            ['nombre' => 'productos.ver', 'descripcion' => 'Ver listado de productos'],
            ['nombre' => 'productos.crear', 'descripcion' => 'Crear nuevos productos'],
            ['nombre' => 'productos.editar', 'descripcion' => 'Editar productos existentes'],
            ['nombre' => 'productos.eliminar', 'descripcion' => 'Eliminar o desactivar productos'],
            ['nombre' => 'inventario.ajustar', 'descripcion' => 'Realizar ajustes manuales de stock'],
            ['nombre' => 'almacen.ver', 'descripcion' => 'Ver configuración de almacenes'],
            
            // Clientes
            ['nombre' => 'clientes.ver', 'descripcion' => 'Ver listado de clientes'],
            ['nombre' => 'clientes.editar', 'descripcion' => 'Editar datos de clientes'],
            ['nombre' => 'clientes.bloquear', 'descripcion' => 'Bloquear o desbloquear clientes'],
            
            // Usuarios / Trabajadores (Staff)
            ['nombre' => 'trabajadores.ver', 'descripcion' => 'Ver listado de trabajadores'],
            ['nombre' => 'trabajadores.crear', 'descripcion' => 'Crear nuevos trabajadores y asignar roles'],
            ['nombre' => 'trabajadores.editar', 'descripcion' => 'Modificar trabajadores existentes'],
            ['nombre' => 'trabajadores.eliminar', 'descripcion' => 'Eliminar trabajadores del sistema'],
            
            // Roles y Permisos
            ['nombre' => 'roles.gestionar', 'descripcion' => 'Gestionar roles y permisos del sistema'],
            
            // Configuración
            ['nombre' => 'configuracion.ver', 'descripcion' => 'Ver configuración general del sistema'],
            ['nombre' => 'configuracion.editar', 'descripcion' => 'Modificar opciones del sistema'],
        ];

        $permisosData = array_map(function($p) use ($now) {
            $p['created_at'] = $now;
            $p['updated_at'] = $now;
            return $p;
        }, $permisosList);

        DB::table('permiso')->insert($permisosData);
        $permisos = DB::table('permiso')->get()->keyBy('nombre');

        // 3. Crear Roles
        $rolesList = [
            ['nombre' => 'admin', 'descripcion' => 'Administrador General (Control total del sistema)'],
            ['nombre' => 'gerente', 'descripcion' => 'Gerente de Tienda (Control operativo y reportes)'],
            ['nombre' => 'cajero', 'descripcion' => 'Cajero/Vendedor (Acceso al POS y clientes)'],
            ['nombre' => 'almacen', 'descripcion' => 'Almacenero (Gestión de stock, despachos e inventario)'],
            ['nombre' => 'marketing', 'descripcion' => 'Marketing (Gestión de clientes y reportes)'],
        ];

        $rolesData = array_map(function($r) use ($now) {
            $r['created_at'] = $now;
            $r['updated_at'] = $now;
            return $r;
        }, $rolesList);

        DB::table('rol')->insert($rolesData);
        $roles = DB::table('rol')->get()->keyBy('nombre');

        // 4. Asignar Permisos a Roles (rol_permiso)
        $rolPermisos = [];

        // Definir qué permisos tiene cada rol
        $matrizPermisos = [
            'admin' => ['*'], // Tendrá todos
            'gerente' => [
                'dashboard.ver', 'reportes.ventas', 'reportes.inventario', 'reportes.clientes',
                'pos.vender', 'pos.reembolsar', 'ventas.ver', 'pedidos.ver', 'pedidos.gestionar',
                'productos.ver', 'almacen.ver',
                'clientes.ver', 'clientes.editar',
                'trabajadores.ver'
            ],
            'cajero' => [
                'dashboard.ver', 'pos.vender', 'ventas.ver', 'clientes.ver'
            ],
            'almacen' => [
                'dashboard.ver', 'pedidos.ver', 'pedidos.gestionar', 
                'productos.ver', 'productos.editar', 'inventario.ajustar', 'almacen.ver'
            ],
            'marketing' => [
                'dashboard.ver', 'reportes.ventas', 'reportes.clientes',
                'productos.ver', 'clientes.ver'
            ]
        ];

        foreach ($matrizPermisos as $rolNombre => $listaPermisos) {
            $rolId = $roles[$rolNombre]->id;
            
            if ($listaPermisos === ['*']) {
                $listaPermisos = $permisos->keys()->toArray();
            }

            foreach ($listaPermisos as $permisoNombre) {
                if (isset($permisos[$permisoNombre])) {
                    $rolPermisos[] = [
                        'rol_id' => $rolId,
                        'permiso_id' => $permisos[$permisoNombre]->id
                    ];
                }
            }
        }

        DB::table('rol_permiso')->insert($rolPermisos);

        // 5. Crear Usuarios Semilla
        $password = Hash::make($demoPassword);
        $usuariosData = [
            [
                'nombres' => 'Eduardo (Admin)',
                'apellidos' => 'Capcha',
                'email' => 'admin@novape.com',
                'password_hash' => $password,
                'estado' => 'activo',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'nombres' => 'María (Cajera)',
                'apellidos' => 'Pérez',
                'email' => 'cajero@novape.com',
                'password_hash' => $password,
                'estado' => 'activo',
                'created_at' => $now,
                'updated_at' => $now
            ],
            [
                'nombres' => 'Juan (Almacén)',
                'apellidos' => 'Gómez',
                'email' => 'almacen@novape.com',
                'password_hash' => $password,
                'estado' => 'activo',
                'created_at' => $now,
                'updated_at' => $now
            ]
        ];
        
        foreach ($usuariosData as $userData) {
            $userId = DB::table('usuario')->insertGetId($userData);
            
            // Asignar rol correspondiente
            $rolId = null;
            if (str_contains($userData['email'], 'admin')) $rolId = $roles['admin']->id;
            else if (str_contains($userData['email'], 'cajero')) $rolId = $roles['cajero']->id;
            else if (str_contains($userData['email'], 'almacen')) $rolId = $roles['almacen']->id;
            
            if ($rolId) {
                DB::table('usuario_rol')->insert([
                    'usuario_id' => $userId,
                    'rol_id' => $rolId
                ]);
            }
        }
    }
}
