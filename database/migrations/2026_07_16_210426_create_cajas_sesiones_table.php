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
        Schema::create('cajas_sesiones', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('cajero_id')->nullable(); // Reference to usuario table
            $table->timestamp('fecha_apertura')->useCurrent();
            $table->decimal('monto_inicial', 10, 2)->default(0);
            $table->timestamp('fecha_cierre')->nullable();
            $table->decimal('monto_final_esperado', 10, 2)->nullable();
            $table->decimal('monto_final_declarado', 10, 2)->nullable();
            $table->decimal('descuadre', 10, 2)->nullable(); // Sobrante positivo, faltante negativo
            $table->enum('estado', ['abierta', 'cerrada'])->default('abierta');
            $table->timestamps();

            // Foreign key (if usuario table exists as such)
            $table->foreign('cajero_id')->references('id')->on('usuario')->nullOnDelete();
        });

        Schema::table('ventas_pos', function (Blueprint $table) {
            $table->unsignedBigInteger('caja_sesion_id')->nullable()->after('cajero_id');
            $table->foreign('caja_sesion_id')->references('id')->on('cajas_sesiones')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas_pos', function (Blueprint $table) {
            $table->dropForeign(['caja_sesion_id']);
            $table->dropColumn('caja_sesion_id');
        });
        Schema::dropIfExists('cajas_sesiones');
    }
};
