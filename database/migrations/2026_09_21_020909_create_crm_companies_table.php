<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_companies', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('dominio')->nullable()->unique();
            $table->string('industria')->nullable();
            $table->enum('tamaño', ['startup', 'pequeña', 'mediana', 'grande', 'enterprise'])->nullable();
            $table->string('sitio_web')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('pais')->nullable();
            $table->string('logo_url')->nullable();
            $table->bigInteger('usuario_responsable_id')->nullable();
            $table->json('custom_fields')->nullable();
            $table->decimal('ingresos_anuales', 15, 2)->nullable();
            $table->integer('empleados')->nullable();
            $table->text('descripcion')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('usuario_responsable_id')
                  ->references('id')
                  ->on('usuario')
                  ->nullOnDelete();

            $table->index('nombre');
            $table->index('usuario_responsable_id');
            $table->index('industria');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_companies');
    }
};
