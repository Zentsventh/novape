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
        Schema::table('direccion_usuario', function (Blueprint $table) {
            $table->boolean('principal')->default(false)->after('codigo_postal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('direccion_usuario', function (Blueprint $table) {
            $table->dropColumn('principal');
        });
    }
};
