<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff_thread_members', function (Blueprint $table) {
            $table->boolean('archived')->default(false);
        });
        Schema::table('staff_messages', function (Blueprint $table) {
            $table->index(['thread_id', 'updated_at'], 'staff_messages_thread_updates');
        });
        Schema::table('staff_calls', function (Blueprint $table) {
            $table->index(['thread_id', 'status'], 'staff_calls_thread_status');
        });
    }

    public function down(): void
    {
        Schema::table('staff_thread_members', fn (Blueprint $table) => $table->dropColumn('archived'));
        Schema::table('staff_messages', fn (Blueprint $table) => $table->dropIndex('staff_messages_thread_updates'));
        Schema::table('staff_calls', fn (Blueprint $table) => $table->dropIndex('staff_calls_thread_status'));
    }
};
