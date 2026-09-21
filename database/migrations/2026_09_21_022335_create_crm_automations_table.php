<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_automations', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->boolean('activo')->default(true);
            $table->string('trigger_type'); // e.g., 'deal_created', 'stage_changed'
            $table->json('condiciones')->nullable(); // JSON array of rules to evaluate
            $table->json('acciones'); // JSON array of actions: e.g., [['type' => 'webhook', 'url' => '...']]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_automations');
    }
};
