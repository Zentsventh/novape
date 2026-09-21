<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('omnichannel_conversations', function (Blueprint $table) {
            $table->timestamp('closed_at')->nullable()->after('resolved_by');
            $table->enum('closed_by', ['visitor', 'agent'])->nullable()->after('closed_at');
        });

        // Agregar índice en omnichannel_contacts(usuario_id) para búsqueda eficiente
        Schema::table('omnichannel_contacts', function (Blueprint $table) {
            $table->index('usuario_id', 'idx_contacts_usuario_id');
        });
    }

    public function down(): void
    {
        Schema::table('omnichannel_conversations', function (Blueprint $table) {
            $table->dropColumn(['closed_at', 'closed_by']);
        });

        Schema::table('omnichannel_contacts', function (Blueprint $table) {
            $table->dropIndex('idx_contacts_usuario_id');
        });
    }
};
