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
        Schema::create('crm_deals', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('usuario_id');
            $table->foreign('usuario_id')->references('id')->on('usuario')->cascadeOnDelete();
            
            $table->foreignId('stage_id')->constrained('crm_stages');
            $table->string('titulo');
            $table->decimal('valor', 10, 2)->default(0);
            $table->string('estado')->default('open'); // open, won, lost
            $table->timestamp('fecha_cierre_esperada')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_deals');
    }
};
