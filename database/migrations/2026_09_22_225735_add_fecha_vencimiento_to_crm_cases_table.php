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
        Schema::table('crm_cases', function (Blueprint $table) {
            $table->dateTime('fecha_vencimiento')->nullable()->after('prioridad');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_cases', function (Blueprint $table) {
            $table->dropColumn('fecha_vencimiento');
        });
    }
};
