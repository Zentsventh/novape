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
        Schema::create('resenas', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('producto_id');
            $table->bigInteger('usuario_id');
            $table->integer('calificacion');
            $table->text('comentario')->nullable();
            $table->boolean('aprobado')->default(false);
            $table->timestamps();
            $table->foreign('producto_id')->references('id')->on('producto')->onDelete('cascade');
            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resenas');
    }
};
