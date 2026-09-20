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
        Schema::create('crm_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('crm_deals')->onDelete('cascade');
            $table->bigInteger('usuario_id')->nullable(); // Quién creó la actividad o nota
            $table->string('tipo'); // nota, tarea, email, llamada, cambio_estado
            $table->text('contenido')->nullable();
            $table->timestamp('fecha_vencimiento')->nullable(); // Si es una tarea
            $table->boolean('completada')->default(false); // Para tareas
            $table->timestamps();
            
            // Relación con el usuario autor de la actividad
            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_activities');
    }
};
