<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservas_stock', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->index();
            $table->bigInteger('variante_id');
            $table->integer('cantidad');
            $table->timestamp('expires_at');
            $table->timestamps();
            
            $table->foreign('variante_id')->references('id')->on('variante')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservas_stock');
    }
};
