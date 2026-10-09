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
        Schema::create('producto_especificaciones', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('producto_id');
            $table->foreign('producto_id')->references('id')->on('producto')->onDelete('cascade');
            $table->string('clave', 100);
            $table->string('valor', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producto_especificaciones');
    }
};
