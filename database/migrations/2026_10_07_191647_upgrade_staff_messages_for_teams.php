<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff_message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_message_id')->constrained('staff_messages')->cascadeOnDelete();
            $table->string('type')->default('file'); // image, document, audio, video, call
            $table->string('file_path');
            $table->string('file_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->integer('duration')->nullable(); // for audio/video/calls
            $table->string('call_status')->nullable(); // started, missed, ended
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_message_attachments');
    }
};
