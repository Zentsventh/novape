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
        Schema::table('pedido', function (Blueprint $table) {
            $table->string('tipo_comprobante')->default('Boleta');
            $table->string('documento_cliente')->nullable();
            $table->string('nombre_facturacion')->nullable();
            $table->string('direccion_facturacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedido', function (Blueprint $table) {
            $table->dropColumn(['tipo_comprobante', 'documento_cliente', 'nombre_facturacion', 'direccion_facturacion']);
        });
    }
};
