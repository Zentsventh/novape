<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class RealWorkersSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $password = Hash::make('Novape2026.!');
        
        // Ensure roles exist
        $roles = [
            'gerente' => 'Gerente General',
            'supervisor' => 'Supervisor de Tienda',
            'cajero' => 'Cajero / Punto de Venta',
            'almacen' => 'Jefe de Almacén',
            'marketing' => 'Especialista de Marketing',
            'asesor' => 'Atención al Cliente'
        ];
        
        $roleIds = [];
        foreach ($roles as $nombre => $desc) {
            $roleId = DB::table('rol')->where('nombre', $nombre)->value('id');
            if (!$roleId) {
                $roleId = DB::table('rol')->insertGetId([
                    'nombre' => $nombre,
                    'descripcion' => $desc,
                    'created_at' => $now,
                    'updated_at' => $now
                ]);
            }
            $roleIds[$nombre] = $roleId;
        }

        // Real sounding staff profiles (Peruvian names, real DNI formats)
        $staff = [
            ['nombres' => 'Alejandro', 'apellidos' => 'Vargas Rivas', 'email' => 'alejandro.vargas@novape.pe', 'dni' => '41526374', 'role' => 'gerente'],
            ['nombres' => 'Valentina', 'apellidos' => 'Castro Silva', 'email' => 'valentina.castro@novape.pe', 'dni' => '72839405', 'role' => 'supervisor'],
            ['nombres' => 'Sebastián', 'apellidos' => 'Mendoza Torres', 'email' => 'sebastian.mendoza@novape.pe', 'dni' => '70495861', 'role' => 'cajero'],
            ['nombres' => 'Camila', 'apellidos' => 'Paredes Rojas', 'email' => 'camila.paredes@novape.pe', 'dni' => '45612378', 'role' => 'cajero'],
            ['nombres' => 'Jorge', 'apellidos' => 'Quispe Mamani', 'email' => 'jorge.quispe@novape.pe', 'dni' => '09876543', 'role' => 'almacen'],
            ['nombres' => 'Lucía', 'apellidos' => 'Herrera Paz', 'email' => 'lucia.herrera@novape.pe', 'dni' => '44998877', 'role' => 'marketing'],
            ['nombres' => 'Diego', 'apellidos' => 'Gutiérrez León', 'email' => 'diego.gutierrez@novape.pe', 'dni' => '73214569', 'role' => 'asesor'],
            ['nombres' => 'Mariana', 'apellidos' => 'Sánchez Vega', 'email' => 'mariana.sanchez@novape.pe', 'dni' => '71569842', 'role' => 'asesor']
        ];

        foreach ($staff as $idx => $s) {
            $existing = DB::table('usuario')->where('email', $s['email'])->first();
            if (!$existing) {
                $userId = DB::table('usuario')->insertGetId([
                    'nombres' => $s['nombres'],
                    'apellidos' => $s['apellidos'],
                    'tipo_documento' => 'DNI',
                    'dni' => $s['dni'],
                    'email' => $s['email'],
                    'telefono' => '9' . rand(10000000, 99999999),
                    'password_hash' => $password,
                    'estado' => 'activo',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } else {
                $userId = $existing->id;
            }

            DB::table('usuario_rol')->updateOrInsert([
                'usuario_id' => $userId,
                'rol_id' => $roleIds[$s['role']]
            ]);
        }
        
        // Let's ensure ALL permissions are attached to 'gerente'
        $allPerms = DB::table('permiso')->pluck('id');
        foreach ($allPerms as $pid) {
            DB::table('rol_permiso')->updateOrInsert(['rol_id' => $roleIds['gerente'], 'permiso_id' => $pid]);
        }
        
        // Basic permissions for others
        $posPerms = DB::table('permiso')->whereIn('nombre', ['ver_dashboard', 'pos.vender'])->pluck('id');
        foreach ($posPerms as $pid) DB::table('rol_permiso')->updateOrInsert(['rol_id' => $roleIds['cajero'], 'permiso_id' => $pid]);
        
        $almacenPerms = DB::table('permiso')->whereIn('nombre', ['ver_dashboard', 'inventario.gestionar'])->pluck('id');
        foreach ($almacenPerms as $pid) DB::table('rol_permiso')->updateOrInsert(['rol_id' => $roleIds['almacen'], 'permiso_id' => $pid]);
        
        $asesorPerms = DB::table('permiso')->whereIn('nombre', ['ver_dashboard', 'ver_pedidos', 'ver_usuarios'])->pluck('id');
        foreach ($asesorPerms as $pid) DB::table('rol_permiso')->updateOrInsert(['rol_id' => $roleIds['asesor'], 'permiso_id' => $pid]);
        
        $mktPerms = DB::table('permiso')->whereIn('nombre', ['ver_dashboard', 'marketing.gestionar', 'gestionar_ajustes'])->pluck('id');
        foreach ($mktPerms as $pid) DB::table('rol_permiso')->updateOrInsert(['rol_id' => $roleIds['marketing'], 'permiso_id' => $pid]);
    }
}
