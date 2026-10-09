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
        Schema::create('reclamos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('tipo_documento');
            $table->string('numero_documento');
            $table->string('telefono');
            $table->string('email');
            $table->string('tipo_reclamo');
            $table->text('detalle');
            $table->string('estado')->default('Pendiente');
            $table->text('respuesta_admin')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reclamos');
    }
};
