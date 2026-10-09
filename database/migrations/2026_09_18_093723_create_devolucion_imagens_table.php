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
        Schema::create('devolucion_imagenes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('devolucion_id');
            $table->string('ruta_imagen');
            $table->timestamps();
            
            $table->foreign('devolucion_id')->references('id')->on('devoluciones')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devolucion_imagenes');
    }
};
