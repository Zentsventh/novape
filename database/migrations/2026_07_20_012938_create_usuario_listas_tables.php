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
        Schema::create('usuario_listas', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('usuario_id');
            $table->string('nombre');
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
        });

        Schema::create('usuario_lista_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lista_id')->constrained('usuario_listas')->onDelete('cascade');
            $table->bigInteger('producto_id');
            $table->timestamps();
            
            $table->unique(['lista_id', 'producto_id']);
            $table->foreign('producto_id')->references('id')->on('producto')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuario_lista_items');
        Schema::dropIfExists('usuario_listas');
    }
};
