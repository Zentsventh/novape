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
        Schema::table('crm_deals', function (Blueprint $table) {
            $table->foreignId('omnichannel_conversation_id')->nullable()->constrained('omnichannel_conversations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_deals', function (Blueprint $table) {
            $table->dropForeign(['omnichannel_conversation_id']);
            $table->dropColumn('omnichannel_conversation_id');
        });
    }
};
