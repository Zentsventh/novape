<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_notes', function (Blueprint $table) {
            $table->id();
            $table->morphs('notable'); // notable_id, notable_type
            $table->text('contenido');
            $table->bigInteger('usuario_id')->nullable(); // autor de la nota
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('usuario_id')->references('id')->on('usuario')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_notes');
    }
};
