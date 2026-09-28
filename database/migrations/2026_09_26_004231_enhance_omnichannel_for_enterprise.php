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
        // 1. Tabla de configuración de asesores (estado, límites, skills)
        if (!Schema::hasTable('omnichannel_agent_configs')) {
            Schema::create('omnichannel_agent_configs', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('usuario_id');
            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
            $table->string('status')->default('offline'); // online, busy, away, offline
            $table->integer('max_chats')->default(5);
            $table->json('skills')->nullable(); // Ej: ["ventas", "soporte"]
            $table->timestamps();
        });
        }

        // 2. Tabla de cola de espera (Queue)
        if (!Schema::hasTable('omnichannel_queues')) {
            Schema::create('omnichannel_queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('omnichannel_conversations')->onDelete('cascade');
            $table->string('priority')->default('normal'); // urgente, alta, normal, baja
            $table->string('required_skill')->nullable(); // Si necesita una skill específica
            $table->timestamp('queued_at')->useCurrent();
            $table->timestamps();
        });
        }


        // 3. Mejoras a la tabla conversations
        Schema::table('omnichannel_conversations', function (Blueprint $table) {
            // Ampliar status enum: bot, esperando_asignacion, en_atencion, esperando_cliente, esperando_asesor, transferido, resuelto, cerrado
            // No podemos cambiar enum fácil, así que lo dejaremos igual y usaremos un campo state/etapa adicional si es necesario
            // o simplemente manejaremos los estados de string de la app.
            // Para simplificar, priority ya fue agregada en la migración base de conversations. (Checkeado: linea 17: priority low, normal, high, urgent).
            // Entonces priority no lo agregaremos de nuevo, solo lo modificaremos si es necesario.
            // PERO en este proyecto ya había una priority.
            if (!Schema::hasColumn('omnichannel_conversations', 'waiting_since')) {
            $table->timestamp('waiting_since')->nullable()->after('bot_paused_at');
        }
            if (!Schema::hasColumn('omnichannel_conversations', 'closed_at')) { $table->timestamp('closed_at')->nullable()->after('waiting_since'); }
            if (!Schema::hasColumn('omnichannel_conversations', 'closed_by')) { $table->bigInteger('closed_by')->nullable()->after('closed_at'); }
            if (!Schema::hasColumn('omnichannel_conversations', 'closed_by')) { $table->foreign('closed_by')->references('id')->on('usuario')->onDelete('set null'); }
            if (!Schema::hasColumn('omnichannel_conversations', 'close_reason')) { $table->string('close_reason')->nullable()->after('closed_by'); }
        });
        
        // 4. Mejoras a la tabla messages
        Schema::table('omnichannel_messages', function (Blueprint $table) {
            $table->boolean('is_private_note')->default(false)->after('is_ai_generated'); // Notas internas
        });

        // 5. Tabla de auditoría / transferencias
        Schema::create('omnichannel_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('omnichannel_conversations')->onDelete('cascade');
            $table->bigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('usuario')->onDelete('set null');
            $table->string('action'); // "transfer", "takeover", "close", "reopen"
            $table->text('description')->nullable();
            $table->json('meta_data')->nullable(); // Detalles extra
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('omnichannel_audit_logs');
        
        Schema::table('omnichannel_messages', function (Blueprint $table) {
            $table->dropColumn('is_private_note');
        });

        Schema::table('omnichannel_conversations', function (Blueprint $table) {
            $table->dropForeign(['closed_by']);
            $table->dropColumn(['waiting_since', 'closed_at', 'closed_by', 'close_reason']);
        });

        Schema::dropIfExists('omnichannel_queues');
        Schema::dropIfExists('omnichannel_agent_configs');
    }
};
