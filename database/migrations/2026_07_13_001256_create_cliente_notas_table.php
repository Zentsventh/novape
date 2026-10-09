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
        Schema::create('cliente_notas', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('cliente_id');
            $table->bigInteger('autor_id')->nullable(); // el admin o staff que hizo la nota
            $table->text('nota');
            $table->timestamps();
            
            $table->foreign('cliente_id')->references('id')->on('usuario')->onDelete('cascade');
            $table->foreign('autor_id')->references('id')->on('usuario')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cliente_notas');
    }
};
