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
        Schema::table('cupones', function (Blueprint $table) {
            $table->boolean('unico_por_cliente')->default(true)->after('activo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cupones', function (Blueprint $table) {
            $table->dropColumn('unico_por_cliente');
        });
    }
};
