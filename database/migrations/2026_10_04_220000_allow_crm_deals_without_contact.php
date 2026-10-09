<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_deals', function (Blueprint $table) {
            $table->bigInteger('usuario_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (DB::table('crm_deals')->whereNull('usuario_id')->exists()) {
            throw new RuntimeException('Asigna una persona a las oportunidades sin contacto antes de revertir esta migración.');
        }
        Schema::table('crm_deals', function (Blueprint $table) {
            $table->bigInteger('usuario_id')->nullable(false)->change();
        });
    }
};
