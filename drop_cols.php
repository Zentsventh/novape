<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;

DB::statement('DROP TABLE IF EXISTS omnichannel_agent_configs');
DB::statement('DROP TABLE IF EXISTS omnichannel_queues');
DB::statement('DROP TABLE IF EXISTS omnichannel_audit_logs');

try {
    Schema::table('omnichannel_conversations', function (Blueprint $table) {
        $table->dropForeign(['closed_by']);
    });
} catch (\Exception $e) {}

try {
    Schema::table('omnichannel_conversations', function (Blueprint $table) {
        if (Schema::hasColumn('omnichannel_conversations', 'closed_by')) $table->dropColumn('closed_by');
        if (Schema::hasColumn('omnichannel_conversations', 'close_reason')) $table->dropColumn('close_reason');
        if (Schema::hasColumn('omnichannel_conversations', 'closed_at')) $table->dropColumn('closed_at');
        if (Schema::hasColumn('omnichannel_conversations', 'waiting_since')) $table->dropColumn('waiting_since');
    });
} catch (\Exception $e) { echo $e->getMessage() . "\n"; }

try {
    Schema::table('omnichannel_messages', function (Blueprint $table) {
        if (Schema::hasColumn('omnichannel_messages', 'is_private_note')) $table->dropColumn('is_private_note');
    });
} catch (\Exception $e) { echo $e->getMessage() . "\n"; }

// Also remove from migrations table just in case
DB::table('migrations')->where('migration', 'like', '%enhance_omnichannel_for_enterprise%')->delete();

echo "Cleaned up\n";
