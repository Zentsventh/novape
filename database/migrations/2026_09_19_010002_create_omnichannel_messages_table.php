<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omnichannel_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('omnichannel_conversations')->cascadeOnDelete();
            $table->foreignId('contact_id')->constrained('omnichannel_contacts')->cascadeOnDelete();
            $table->bigInteger('user_id')->nullable();
            $table->enum('channel', ['whatsapp', 'messenger', 'instagram']);
            $table->enum('direction', ['inbound', 'outbound']);
            $table->enum('message_type', [
                'text', 'image', 'audio', 'video', 'document', 'sticker',
                'location', 'contact', 'template', 'interactive', 'reaction', 'unsupported'
            ])->default('text');
            $table->text('content')->nullable();
            $table->string('media_url', 500)->nullable();
            $table->string('media_mime_type', 100)->nullable();
            $table->integer('media_file_size')->unsigned()->nullable();
            $table->boolean('is_ai_generated')->default(false);
            $table->enum('ai_engine_used', ['local', 'gemini'])->nullable();
            $table->integer('ai_tokens_used')->unsigned()->nullable()->default(0);
            $table->integer('ai_response_time_ms')->unsigned()->nullable();
            $table->boolean('is_internal_note')->default(false);
            $table->enum('status', ['queued', 'sent', 'delivered', 'read', 'failed', 'deleted'])->default('queued');
            $table->string('error_message', 500)->nullable();
            $table->string('external_message_id', 255)->nullable()->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('usuario')->nullOnDelete();

            $table->index(['conversation_id', 'created_at']);
            $table->index(['contact_id', 'created_at']);
            $table->index(['channel', 'created_at']);
            $table->index(['direction', 'created_at']);
            $table->index(['conversation_id', 'is_internal_note']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omnichannel_messages');
    }
};
