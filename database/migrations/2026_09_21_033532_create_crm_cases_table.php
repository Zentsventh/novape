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
        Schema::create('crm_cases', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['devolucion', 'demora', 'reclamo', 'consulta'])->default('consulta');
            $table->enum('estado', ['abierto', 'en_progreso', 'resuelto', 'cerrado'])->default('abierto');
            $table->enum('prioridad', ['baja', 'media', 'alta', 'urgente'])->default('media');
            
            // Relaciones
            $table->bigInteger('cliente_id')->nullable();
            $table->foreign('cliente_id')->references('id')->on('usuario')->nullOnDelete();
            
            $table->bigInteger('pedido_id')->nullable();
            $table->foreign('pedido_id')->references('id')->on('pedido')->nullOnDelete();
            
            $table->bigInteger('asignado_a')->nullable();
            $table->foreign('asignado_a')->references('id')->on('usuario')->nullOnDelete();
            
            $table->foreignId('deal_id')->nullable()->constrained('crm_deals')->nullOnDelete();
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_cases');
    }
};
