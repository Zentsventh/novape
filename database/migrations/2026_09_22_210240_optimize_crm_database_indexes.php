<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('crm_deals', function (Blueprint $table) {
            $table->index('estado');
        });

        Schema::table('actividad_logs', function (Blueprint $table) {
            $table->index(['modelo', 'modelo_id']);
        });
    }

    public function down(): void
    {
        Schema::table('actividad_logs', function (Blueprint $table) {
            $table->dropIndex(['modelo', 'modelo_id']);
        });

        Schema::table('crm_deals', function (Blueprint $table) {
            $table->dropIndex(['estado']);
        });
    }
};
