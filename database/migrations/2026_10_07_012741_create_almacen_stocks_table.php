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
        Schema::create('almacen_stocks', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('variante_id');
            $table->foreign('variante_id')->references('id')->on('variante')->onDelete('cascade');
            
            $table->foreignId('almacen_id')->constrained('almacenes')->onDelete('cascade');
            
            $table->integer('stock_fisico')->default(0);
            $table->integer('stock_reservado')->default(0); // Para pedidos web en curso
            
            // Ubicación física dentro del almacén (opcional pero vital para WMS)
            $table->string('pasillo', 50)->nullable();
            $table->string('estante', 50)->nullable();
            $table->string('nivel', 50)->nullable();
            
            $table->timestamps();
            
            $table->unique(['variante_id', 'almacen_id']); // Una variante no puede estar repetida en el mismo almacén
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('almacen_stocks');
    }
};
