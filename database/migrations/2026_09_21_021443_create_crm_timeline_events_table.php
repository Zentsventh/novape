<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_timeline_events', function (Blueprint $table) {
            $table->id();
            $table->morphs('trackable'); // trackable_id, trackable_type
            $table->string('event_type'); // 'nota_creada', 'deal_creado', 'deal_movido', 'campo_actualizado', etc.
            $table->text('descripcion')->nullable();
            $table->json('metadata')->nullable();
            $table->bigInteger('usuario_id')->nullable(); // el actor que causó el evento
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuario')->nullOnDelete();
            
            // Helpful index for timeline rendering
            $table->index(['trackable_type', 'trackable_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_timeline_events');
    }
};
