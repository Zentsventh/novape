<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omnichannel_channels', function (Blueprint $table) {
            $table->id();
            $table->enum('channel', ['whatsapp', 'messenger', 'instagram']);
            $table->string('channel_name', 100)->nullable();
            $table->string('phone_number_id', 50)->nullable()->index();
            $table->string('whatsapp_business_id', 50)->nullable();
            $table->string('page_id', 50)->nullable()->index();
            $table->string('instagram_account_id', 50)->nullable()->index();
            $table->text('access_token')->nullable();
            $table->string('webhook_verify_token', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_webhook_at')->nullable();
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->index(['channel', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omnichannel_channels');
    }
};
