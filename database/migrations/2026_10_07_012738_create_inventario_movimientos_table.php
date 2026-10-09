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
        Schema::create('inventario_movimientos', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('variante_id');
            $table->foreign('variante_id')->references('id')->on('variante')->onDelete('cascade');
            
            $table->foreignId('almacen_id')->constrained('almacenes')->onDelete('cascade');
            
            $table->bigInteger('usuario_id')->nullable();
            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('set null');
            
            $table->string('tipo', 50); // entrada, salida, ajuste, devolucion, transferencia
            $table->integer('cantidad'); // Positiva o negativa
            $table->integer('stock_anterior'); // Snapshot del stock antes del mov
            $table->integer('stock_nuevo');    // Snapshot del stock despues
            
            $table->decimal('costo_unitario', 12, 2)->nullable();
            
            $table->string('motivo')->nullable(); // Ej: Venta POS, Compra, Ajuste por merma
            $table->string('referencia_tipo')->nullable(); // Ej: App\Models\Pedido, App\Models\Comprobante
            $table->unsignedBigInteger('referencia_id')->nullable();
            
            $table->timestamps();
            
            $table->index(['variante_id', 'almacen_id']);
            $table->index(['referencia_tipo', 'referencia_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventario_movimientos');
    }
};
