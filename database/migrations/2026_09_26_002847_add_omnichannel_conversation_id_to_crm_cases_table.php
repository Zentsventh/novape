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
        Schema::table('crm_cases', function (Blueprint $table) {
            $table->unsignedBigInteger('omnichannel_conversation_id')->nullable()->after('deal_id');
            $table->foreign('omnichannel_conversation_id')->references('id')->on('omnichannel_conversations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_cases', function (Blueprint $table) {
            $table->dropForeign(['omnichannel_conversation_id']);
            $table->dropColumn('omnichannel_conversation_id');
        });
    }
};
