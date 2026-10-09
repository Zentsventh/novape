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
        Schema::create('crm_evidence_ledgers', function (Blueprint $table) {
            $table->id();
            $table->string('model_type'); // 'deal' or 'user'
            $table->unsignedBigInteger('model_id');
            $table->string('field_name'); // e.g., 'industria', 'linkedin_url'
            $table->string('suggested_value'); // What the agent thinks the value is
            $table->integer('confidence_score'); // 0-100
            $table->string('source')->nullable(); // 'web_search', 'email_thread', 'linkedin'
            $table->string('status')->default('pending'); // 'pending', 'accepted', 'rejected'
            $table->timestamps();
            
            $table->index(['model_type', 'model_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_evidence_ledgers');
    }
};
