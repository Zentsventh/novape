<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omnichannel_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('omnichannel_contacts')->cascadeOnDelete();
            $table->bigInteger('assigned_user_id')->nullable();
            $table->enum('channel', ['whatsapp', 'messenger', 'instagram']);
            $table->enum('status', ['open', 'bot_active', 'human_active', 'waiting', 'resolved', 'closed'])->default('bot_active');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->string('subject', 255)->nullable();
            $table->boolean('is_bot_paused')->default(false);
            $table->timestamp('bot_paused_at')->nullable();
            $table->bigInteger('bot_paused_by')->nullable();
            $table->boolean('auto_assigned')->default(false);
            $table->timestamp('last_message_at')->nullable();
            $table->string('last_message_preview', 255)->nullable();
            $table->integer('message_count')->unsigned()->default(0);
            $table->integer('unread_count')->unsigned()->default(0);
            $table->timestamp('resolved_at')->nullable();
            $table->bigInteger('resolved_by')->nullable();
            $table->timestamps();

            $table->foreign('assigned_user_id')->references('id')->on('usuario')->nullOnDelete();
            $table->foreign('bot_paused_by')->references('id')->on('usuario')->nullOnDelete();
            $table->foreign('resolved_by')->references('id')->on('usuario')->nullOnDelete();

            $table->index(['status', 'last_message_at']);
            $table->index(['channel', 'status']);
            $table->index(['assigned_user_id', 'unread_count']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omnichannel_conversations');
    }
};
