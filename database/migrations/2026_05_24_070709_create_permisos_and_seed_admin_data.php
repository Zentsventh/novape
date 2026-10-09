<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create permiso table if it doesn't exist
        if (!Schema::hasTable('permiso')) {
            Schema::create('permiso', function (Blueprint $table) {
                $table->id();
                $table->string('nombre', 100)->unique();
                $table->string('descripcion', 255)->nullable();
                $table->timestamps();
            });
        }

        // 2. Create rol_permiso table if it doesn't exist
        if (!Schema::hasTable('rol_permiso')) {
            Schema::create('rol_permiso', function (Blueprint $table) {
                $table->id();
                $table->bigInteger('rol_id'); // Match bigint(20) signed
                $table->unsignedBigInteger('permiso_id');
                $table->foreign('rol_id')->references('id')->on('rol')->onDelete('cascade');
                $table->foreign('permiso_id')->references('id')->on('permiso')->onDelete('cascade');
            });
        }

        // 3. Seed Permissions
        $permisosData = [
            ['nombre' => 'ver_dashboard', 'descripcion' => 'Acceso al panel de control'],
            ['nombre' => 'ver_productos', 'descripcion' => 'Ver lista de productos e inventario'],
            ['nombre' => 'crear_producto', 'descripcion' => 'Crear nuevos productos y promociones'],
            ['nombre' => 'editar_producto', 'descripcion' => 'Editar productos existentes'],
            ['nombre' => 'eliminar_producto', 'descripcion' => 'Eliminar productos'],
            ['nombre' => 'ver_pedidos', 'descripcion' => 'Ver lista de pedidos y detalles'],
            ['nombre' => 'editar_pedido', 'descripcion' => 'Modificar estado de pedidos'],
            ['nombre' => 'ver_usuarios', 'descripcion' => 'Ver lista de clientes y usuarios'],
            ['nombre' => 'editar_usuario', 'descripcion' => 'Editar datos y bloquear usuarios'],
            ['nombre' => 'gestionar_ajustes', 'descripcion' => 'Modificar banners, roles y configuración web'],
            ['nombre' => 'gestionar_cupones', 'descripcion' => 'Crear y editar cupones'],
            ['nombre' => 'gestionar_categorias', 'descripcion' => 'Crear y editar categorías'],
            ['nombre' => 'gestionar_marcas', 'descripcion' => 'Crear y editar marcas'],
            ['nombre' => 'ver_analiticas', 'descripcion' => 'Ver métricas y reportes'],
        ];

        foreach ($permisosData as $p) {
            DB::table('permiso')->updateOrInsert(
                ['nombre' => $p['nombre']],
                ['descripcion' => $p['descripcion'], 'created_at' => now(), 'updated_at' => now()]
            );
        }

        // 4. Ensure Admin Role exists
        DB::table('rol')->updateOrInsert(
            ['nombre' => 'admin'],
            ['descripcion' => 'Administrador Total']
        );
        $adminRole = DB::table('rol')->where('nombre', 'admin')->first();

        // 5. Assign all permissions to admin
        $allPermisos = DB::table('permiso')->pluck('id');
        foreach ($allPermisos as $permisoId) {
            DB::table('rol_permiso')->updateOrInsert([
                'rol_id' => $adminRole->id,
                'permiso_id' => $permisoId
            ]);
        }

        // El primer administrador se crea explícitamente, sin credenciales predeterminadas.
        $adminEmail = env('INITIAL_ADMIN_EMAIL');
        $adminPassword = env('INITIAL_ADMIN_PASSWORD');
        if ($adminEmail && $adminPassword) {
            $userId = DB::table('usuario')->insertGetId([
                'nombres' => 'Admin',
                'apellidos' => 'Root',
                'email' => $adminEmail,
                'password_hash' => Hash::make($adminPassword),
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('usuario_rol')->updateOrInsert([
                'usuario_id' => $userId,
                'rol_id' => $adminRole->id,
            ]);
        }


    }

    public function down(): void
    {
        Schema::dropIfExists('rol_permiso');
        Schema::dropIfExists('permiso');
    }
};
