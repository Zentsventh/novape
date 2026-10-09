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
        Schema::table('stock_almacen', function (Blueprint $table) {
            $table->dropForeign(['almacen_id']);
            $table->foreign('almacen_id')->references('id')->on('almacenes')->restrictOnDelete();
        });

        Schema::table('movimientos_almacen', function (Blueprint $table) {
            $table->dropForeign(['almacen_id']);
            $table->foreign('almacen_id')->references('id')->on('almacenes')->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restrict', function (Blueprint $table) {
            //
        });
    }
};
