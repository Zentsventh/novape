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
        Schema::create('actividad_logs', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->nullable();
            $table->string('accion');
            $table->string('modelo')->nullable();
            $table->unsignedBigInteger('modelo_id')->nullable();
            $table->json('detalles')->nullable();
            $table->timestamps();
            
            // Si la tabla de usuarios se llama 'usuario':
            $table->foreign('user_id')->references('id')->on('usuario')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividad_logs');
    }
};
