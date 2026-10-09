<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_agent_profiles', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->unique();
            $table->foreign('user_id')->references('id')->on('usuario')->cascadeOnDelete();
            $table->string('display_name', 120);
            $table->string('specialty', 180)->nullable();
            $table->boolean('active')->default(true);
            $table->string('timezone', 80)->default('America/Lima');
            $table->unsignedSmallInteger('slot_minutes')->default(30);
            $table->unsignedSmallInteger('booking_days')->default(14);
            $table->unsignedSmallInteger('notice_minutes')->default(60);
            $table->json('weekly_schedule');
            $table->json('exceptions')->nullable();
            $table->timestamps();
        });

        Schema::create('sales_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->nullable()->constrained('omnichannel_conversations')->nullOnDelete();
            $table->foreignId('contact_id')->nullable()->constrained('omnichannel_contacts')->nullOnDelete();
            $table->bigInteger('seller_id');
            $table->foreign('seller_id')->references('id')->on('usuario')->restrictOnDelete();
            $table->foreignId('crm_activity_id')->nullable()->constrained('crm_activities')->nullOnDelete();
            $table->uuid('request_id');
            $table->char('request_fingerprint', 64);
            $table->string('customer_name', 160);
            $table->string('phone', 30);
            $table->string('email')->nullable();
            $table->string('company', 180)->nullable();
            $table->text('interest');
            $table->unsignedInteger('quantity')->nullable();
            $table->decimal('estimated_amount', 14, 2)->nullable();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('timezone', 80)->default('America/Lima');
            $table->string('status', 20)->default('confirmed');
            $table->dateTime('consented_at');
            $table->text('notes')->nullable();
            $table->string('cancellation_reason', 500)->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->foreign('updated_by')->references('id')->on('usuario')->nullOnDelete();
            $table->timestamps();
            $table->unique(['conversation_id', 'request_id']);
            $table->index(['seller_id', 'status', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_appointments');
        Schema::dropIfExists('sales_agent_profiles');
    }
};
