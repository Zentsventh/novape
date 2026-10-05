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

        // 2. Crear Permisos
        $permisosData = [
            ['nombre' => 'ver_dashboard', 'descripcion' => 'Acceso general al panel de administración', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'pos.vender', 'descripcion' => 'Acceso al módulo POS y ventas', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'inventario.gestionar', 'descripcion' => 'Ver y modificar el inventario y almacenes', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'usuarios.gestionar', 'descripcion' => 'Crear, editar o eliminar usuarios y roles', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'reportes.ver', 'descripcion' => 'Ver métricas y reportes del dashboard', 'created_at' => $now, 'updated_at' => $now],
        ];
        DB::table('permiso')->insert($permisosData);

        // Obtener IDs de permisos
        $permisoDash = DB::table('permiso')->where('nombre', 'ver_dashboard')->first()->id;
        $permisoPos = DB::table('permiso')->where('nombre', 'pos.vender')->first()->id;
        $permisoInv = DB::table('permiso')->where('nombre', 'inventario.gestionar')->first()->id;
        $permisoUsu = DB::table('permiso')->where('nombre', 'usuarios.gestionar')->first()->id;
        $permisoRep = DB::table('permiso')->where('nombre', 'reportes.ver')->first()->id;

        // 3. Crear Roles
        $rolesData = [
            ['nombre' => 'admin', 'descripcion' => 'Administrador (Control total)', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'cajero', 'descripcion' => 'Cajero/Vendedor (Acceso al POS)', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'almacen', 'descripcion' => 'Almacenero (Acceso a compras e inventario)', 'created_at' => $now, 'updated_at' => $now],
        ];
        DB::table('rol')->insert($rolesData);

        // Obtener IDs de roles
        $rolAdmin = DB::table('rol')->where('nombre', 'admin')->first()->id;
        $rolCajero = DB::table('rol')->where('nombre', 'cajero')->first()->id;
        $rolAlmacen = DB::table('rol')->where('nombre', 'almacen')->first()->id;

        // 4. Asignar Permisos a Roles (rol_permiso)
        $rolPermisos = [
            // Admin tiene todo
            ['rol_id' => $rolAdmin, 'permiso_id' => $permisoDash],
            ['rol_id' => $rolAdmin, 'permiso_id' => $permisoPos],
            ['rol_id' => $rolAdmin, 'permiso_id' => $permisoInv],
            ['rol_id' => $rolAdmin, 'permiso_id' => $permisoUsu],
            ['rol_id' => $rolAdmin, 'permiso_id' => $permisoRep],
            // Cajero
            ['rol_id' => $rolCajero, 'permiso_id' => $permisoDash],
            ['rol_id' => $rolCajero, 'permiso_id' => $permisoPos],
            // Almacenero
            ['rol_id' => $rolAlmacen, 'permiso_id' => $permisoDash],
            ['rol_id' => $rolAlmacen, 'permiso_id' => $permisoInv],
        ];
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
            if (str_contains($userData['email'], 'admin')) $rolId = $rolAdmin;
            else if (str_contains($userData['email'], 'cajero')) $rolId = $rolCajero;
            else if (str_contains($userData['email'], 'almacen')) $rolId = $rolAlmacen;
            
            if ($rolId) {
                DB::table('usuario_rol')->insert([
                    'usuario_id' => $userId,
                    'rol_id' => $rolId
                ]);
            }
        }
    }
}
