<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            DB::statement("ALTER TABLE omnichannel_conversations MODIFY COLUMN channel ENUM('whatsapp', 'messenger', 'instagram', 'web')");
            DB::statement("ALTER TABLE omnichannel_messages MODIFY COLUMN channel ENUM('whatsapp', 'messenger', 'instagram', 'web')");
        } catch (\Exception $e) {
            // Ignore in SQLite
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('omnichannel_tables', function (Blueprint $table) {
            //
        });
    }
};
