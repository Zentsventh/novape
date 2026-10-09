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
        Schema::create('crm_custom_fields_schema', function (Blueprint $table) {
            $table->id();
            $table->string('model_type'); // 'deal' or 'user'
            $table->string('name'); // e.g., 'industria' (internal key)
            $table->string('label'); // e.g., 'Industria' (UI label)
            $table->string('type'); // 'text', 'number', 'select', 'boolean', 'date'
            $table->json('options')->nullable(); // For select options
            $table->boolean('required')->default(false);
            $table->timestamps();

            // Ensure unique field names per model type
            $table->unique(['model_type', 'name']);
        });

        Schema::table('crm_deals', function (Blueprint $table) {
            $table->json('custom_fields')->nullable();
        });

        Schema::table('usuario', function (Blueprint $table) {
            $table->json('custom_fields')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->dropColumn('custom_fields');
        });

        Schema::table('crm_deals', function (Blueprint $table) {
            $table->dropColumn('custom_fields');
        });

        Schema::dropIfExists('crm_custom_fields_schema');
    }
};

