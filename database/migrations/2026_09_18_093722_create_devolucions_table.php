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
        Schema::create('devoluciones', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('pedido_id');
            $table->bigInteger('usuario_id');
            $table->string('estado')->default('solicitado');
            $table->text('motivo');
            $table->text('comentarios_admin')->nullable();
            $table->timestamps();
            
            $table->foreign('pedido_id')->references('id')->on('pedido')->onDelete('cascade');
            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devoluciones');
    }
};
