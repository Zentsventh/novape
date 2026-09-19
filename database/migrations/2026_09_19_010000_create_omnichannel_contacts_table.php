<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omnichannel_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('phone_number', 20)->nullable()->index();
            $table->string('messenger_id', 100)->nullable()->index();
            $table->string('instagram_id', 100)->nullable()->index();
            $table->string('email', 255)->nullable();
            $table->string('profile_picture_url', 500)->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_blocked')->default(false);
            $table->bigInteger('usuario_id')->nullable();
            $table->timestamp('first_interaction_at')->nullable();
            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuario')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omnichannel_contacts');
    }
};
