<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider'); // niubiz, shippo, etc
            $table->string('event_id')->unique();
            $table->string('type');
            $table->json('payload');
            $table->string('status')->default('pending'); // pending, processed, failed
            $table->text('exception_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
    }
};
