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
        Schema::table('ventas_pos', function (Blueprint $table) {
            $table->decimal('descuento', 10, 2)->default(0)->after('subtotal');
        });

        Schema::create('venta_pos_pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_pos_id')->constrained('ventas_pos')->cascadeOnDelete();
            $table->foreignId('metodo_pago_id')->constrained('metodos_pago')->cascadeOnDelete();
            $table->decimal('monto', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('venta_pos_pagos');
        Schema::table('ventas_pos', function (Blueprint $table) {
            $table->dropColumn('descuento');
        });
    }
};
