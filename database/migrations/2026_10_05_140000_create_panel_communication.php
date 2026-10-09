<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_threads', function (Blueprint $table) {
            $table->id();
            $table->string('title', 120);
            $table->string('direct_key')->nullable()->unique();
            $table->bigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('usuario');
            $table->timestamps();
        });
        Schema::create('staff_thread_members', function (Blueprint $table) {
            $table->foreignId('thread_id')->constrained('staff_threads')->cascadeOnDelete();
            $table->bigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('usuario');
            $table->unsignedBigInteger('last_read_id')->default(0);
            $table->primary(['thread_id', 'user_id']);
        });
        Schema::create('staff_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('staff_threads')->cascadeOnDelete();
            $table->bigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('usuario');
            $table->uuid('request_id');
            $table->text('body');
            $table->timestamps();
            $table->unique(['thread_id', 'request_id']);
            $table->index(['thread_id', 'id']);
        });
        Schema::create('panel_assistant_sessions', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('usuario');
            $table->string('title', 120);
            $table->timestamps();
        });
        Schema::create('panel_assistant_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('panel_assistant_sessions')->cascadeOnDelete();
            $table->uuid('request_id');
            $table->text('question');
            $table->text('answer');
            $table->string('mode');
            $table->timestamps();
            $table->unique(['session_id', 'request_id']);
        });
    }

    public function down(): void
    {
        foreach (['panel_assistant_messages', 'panel_assistant_sessions', 'staff_messages', 'staff_thread_members', 'staff_threads'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
