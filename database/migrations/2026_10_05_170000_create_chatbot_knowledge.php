<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chatbot_knowledge_sources', function (Blueprint $table) {
            $table->id();
            $table->string('title', 160);
            $table->string('type', 10)->default('text');
            $table->longText('content');
            $table->boolean('enabled')->default(false)->index();
            $table->timestamps();
        });
        Schema::create('chatbot_knowledge_chunks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_id')->constrained('chatbot_knowledge_sources')->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->text('content');
            $table->text('search_text');
            $table->unique(['source_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_knowledge_chunks');
        Schema::dropIfExists('chatbot_knowledge_sources');
    }
};
