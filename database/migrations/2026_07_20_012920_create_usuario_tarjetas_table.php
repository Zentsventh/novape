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
        Schema::create('usuario_tarjetas', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('usuario_id');
            $table->string('ultimos_digitos', 4);
            $table->string('marca'); // visa, mastercard, etc.
            $table->boolean('principal')->default(false);
            $table->string('token_simulado')->nullable(); // Para simular tokenización
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuario_tarjetas');
    }
};
