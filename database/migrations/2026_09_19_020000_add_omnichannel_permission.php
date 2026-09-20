<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // Añadir permiso de gestión omnicanal
        DB::table('permiso')->updateOrInsert(
            ['nombre' => 'gestionar_omnichannel'],
            ['descripcion' => 'Gestionar bandeja omnicanal, conversaciones y chatbot', 'created_at' => $now, 'updated_at' => $now]
        );

        // Asignar automáticamente al rol 'admin' si existe
        $permiso = DB::table('permiso')->where('nombre', 'gestionar_omnichannel')->first();
        $adminRol = DB::table('rol')->where('nombre', 'admin')->first();

        if ($permiso && $adminRol) {
            DB::table('rol_permiso')->updateOrInsert(
                ['rol_id' => $adminRol->id, 'permiso_id' => $permiso->id],
                []
            );
        }
    }

    public function down(): void
    {
        $permiso = DB::table('permiso')->where('nombre', 'gestionar_omnichannel')->first();
        if ($permiso) {
            DB::table('rol_permiso')->where('permiso_id', $permiso->id)->delete();
            DB::table('permiso')->where('id', $permiso->id)->delete();
        }
    }
};
