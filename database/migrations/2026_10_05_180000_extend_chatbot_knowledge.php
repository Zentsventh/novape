<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chatbot_settings', function (Blueprint $table) {
            $table->id();
            $table->json('settings');
            $table->timestamps();
        });
        Schema::table('chatbot_knowledge_sources', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1);
            $table->string('index_status', 20)->default('lexical');
            $table->text('index_error')->nullable();
            $table->timestamp('indexed_at')->nullable();
        });
        Schema::table('chatbot_knowledge_chunks', function (Blueprint $table) {
            $table->json('embedding')->nullable();
            $table->string('embedding_model')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('chatbot_knowledge_chunks', fn (Blueprint $table) => $table->dropColumn(['embedding', 'embedding_model']));
        Schema::table('chatbot_knowledge_sources', fn (Blueprint $table) => $table->dropColumn(['version', 'index_status', 'index_error', 'indexed_at']));
        Schema::dropIfExists('chatbot_settings');
    }
};
