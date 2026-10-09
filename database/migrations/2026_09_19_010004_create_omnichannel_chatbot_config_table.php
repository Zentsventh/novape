<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omnichannel_chatbot_config', function (Blueprint $table) {
            $table->id();
            $table->string('bot_name', 100)->default('Asistente Novape');
            $table->text('system_prompt')->nullable();
            $table->json('business_hours')->nullable();
            $table->json('faqs')->nullable();
            $table->text('custom_instructions')->nullable();
            $table->text('welcome_message')->nullable();
            $table->text('out_of_hours_message')->nullable();
            $table->text('bot_paused_message')->nullable();
            $table->boolean('is_bot_active')->default(true);
            $table->tinyInteger('max_context_messages')->unsigned()->default(10);
            $table->decimal('ai_temperature', 2, 1)->default(0.7);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omnichannel_chatbot_config');
    }
};
