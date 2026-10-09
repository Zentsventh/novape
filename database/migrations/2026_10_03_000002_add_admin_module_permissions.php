<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('permiso')) {
            return;
        }

        foreach ([
            'crm.gestionar' => 'Acceder y modificar CRM',
            'finanzas.gestionar' => 'Acceder y modificar gastos',
            'marketing.gestionar' => 'Acceder y modificar campanas de marketing',
        ] as $nombre => $descripcion) {
            DB::table('permiso')->updateOrInsert(
                ['nombre' => $nombre],
                ['descripcion' => $descripcion, 'updated_at' => now()]
            );
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('permiso')) {
            DB::table('permiso')->whereIn('nombre', [
                'crm.gestionar',
                'finanzas.gestionar',
                'marketing.gestionar',
            ])->delete();
        }
    }
};
