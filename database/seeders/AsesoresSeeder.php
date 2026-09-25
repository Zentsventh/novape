<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AsesoresSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $password = Hash::make('12345678');

        // 1. Crear el rol de asesor si no existe
        $roleId = DB::table('rol')->where('nombre', 'asesor')->value('id');
        
        if (!$roleId) {
            $roleId = DB::table('rol')->insertGetId([
                'nombre' => 'asesor',
                'descripcion' => 'Asesor de Atención al Cliente',
                'created_at' => $now,
                'updated_at' => $now
            ]);
        }

        // Asignar permisos básicos al rol asesor (ver_dashboard, ver_usuarios, ver_pedidos)
        $permisosIds = DB::table('permiso')
            ->whereIn('nombre', ['ver_dashboard', 'ver_usuarios', 'ver_pedidos', 'gestionar_omnichannel'])
            ->pluck('id');
            
        foreach ($permisosIds as $pid) {
            DB::table('rol_permiso')->updateOrInsert([
                'rol_id' => $roleId,
                'permiso_id' => $pid
            ]);
        }

        // 2. Crear 5 usuarios asesores
        $asesores = [
            ['nombres' => 'Andrea', 'apellidos' => 'Gómez', 'email' => 'andrea.asesor@novape.com', 'dni' => '44440001'],
            ['nombres' => 'Bruno', 'apellidos' => 'Silva', 'email' => 'bruno.asesor@novape.com', 'dni' => '44440002'],
            ['nombres' => 'Carla', 'apellidos' => 'Mendoza', 'email' => 'carla.asesor@novape.com', 'dni' => '44440003'],
            ['nombres' => 'Diego', 'apellidos' => 'Navarro', 'email' => 'diego.asesor@novape.com', 'dni' => '44440004'],
            ['nombres' => 'Elena', 'apellidos' => 'Ríos', 'email' => 'elena.asesor@novape.com', 'dni' => '44440005'],
        ];

        foreach ($asesores as $idx => $a) {
            $existing = DB::table('usuario')->where('email', $a['email'])->first();
            
            if (!$existing) {
                $userId = DB::table('usuario')->insertGetId([
                    'nombres' => $a['nombres'],
                    'apellidos' => $a['apellidos'],
                    'tipo_documento' => 'DNI',
                    'dni' => $a['dni'],
                    'email' => $a['email'],
                    'telefono' => '90010020' . $idx,
                    'password_hash' => $password,
                    'estado' => 'activo',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } else {
                $userId = $existing->id;
            }

            // Asignar rol
            DB::table('usuario_rol')->updateOrInsert([
                'usuario_id' => $userId,
                'rol_id' => $roleId
            ]);
        }
    }
}
