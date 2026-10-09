<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_worker_profiles', function (Blueprint $table) {
            $table->bigInteger('user_id')->primary();
            $table->foreign('user_id')->references('id')->on('usuario')->cascadeOnDelete();
            $table->string('extension', 16)->unique();
            $table->string('availability', 16)->default('available');
            $table->timestamp('last_seen_at')->nullable()->index();
        });
        DB::table('usuario')->whereNull('deleted_at')->whereExists(fn ($q) => $q->selectRaw('1')->from('usuario_rol as ur')->join('rol as r', 'r.id', '=', 'ur.rol_id')->whereColumn('ur.usuario_id', 'usuario.id')->where('r.nombre', '!=', 'cliente'))
            ->select('id')->orderBy('id')->chunk(200, function ($users) {
                foreach ($users as $user) {
                    DB::table('staff_worker_profiles')->insertOrIgnore(['user_id' => $user->id, 'extension' => (string) (10000 + $user->id)]);
                }
            });
        Schema::table('staff_thread_members', function (Blueprint $table) {
            $table->boolean('pinned')->default(false);
            $table->boolean('muted')->default(false);
            $table->timestamp('typing_until')->nullable();
        });
        Schema::table('staff_messages', function (Blueprint $table) {
            $table->foreignId('reply_to_id')->nullable()->constrained('staff_messages')->nullOnDelete();
            $table->boolean('important')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->softDeletes();
            $table->string('payload_hash', 64)->nullable();
            $table->uuid('call_id')->nullable()->index();
        });
        Schema::table('staff_message_attachments', function (Blueprint $table) {
            $table->string('storage_disk', 16)->default('public');
            $table->string('sha256', 64)->nullable();
        });
        Schema::create('staff_message_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('staff_messages')->cascadeOnDelete();
            $table->bigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('usuario')->cascadeOnDelete();
            $table->string('emoji', 16);
            $table->unique(['message_id', 'user_id', 'emoji']);
        });
        Schema::create('staff_calls', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('thread_id')->constrained('staff_threads')->cascadeOnDelete();
            $table->bigInteger('created_by');
            $table->foreign('created_by')->references('id')->on('usuario');
            $table->uuid('request_id');
            $table->string('title', 120);
            $table->string('kind', 10);
            $table->string('status', 16)->default('ringing');
            $table->string('end_reason', 24)->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['thread_id', 'request_id']);
            $table->index(['status', 'expires_at']);
        });
        Schema::create('staff_call_participants', function (Blueprint $table) {
            $table->uuid('call_id');
            $table->foreign('call_id')->references('id')->on('staff_calls')->cascadeOnDelete();
            $table->bigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('usuario')->cascadeOnDelete();
            $table->string('state', 16)->default('invited');
            $table->uuid('client_id')->nullable();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->boolean('audio_muted')->default(false);
            $table->boolean('video_enabled')->default(false);
            $table->boolean('screen_sharing')->default(false);
            $table->boolean('hand_raised')->default(false);
            $table->primary(['call_id', 'user_id']);
            $table->index(['user_id', 'state']);
        });
        Schema::create('staff_call_signals', function (Blueprint $table) {
            $table->id();
            $table->uuid('call_id');
            $table->foreign('call_id')->references('id')->on('staff_calls')->cascadeOnDelete();
            $table->bigInteger('from_id');
            $table->bigInteger('target_id');
            $table->uuid('client_id');
            $table->uuid('request_id');
            $table->string('kind', 10);
            $table->json('payload');
            $table->timestamp('created_at');
            $table->unique(['call_id', 'from_id', 'request_id']);
            $table->index(['call_id', 'target_id', 'id']);
        });
        Schema::create('staff_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('thread_id')->constrained('staff_threads')->cascadeOnDelete();
            $table->bigInteger('user_id');
            $table->string('action', 32);
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        foreach (['staff_activity_log', 'staff_call_signals', 'staff_call_participants', 'staff_calls', 'staff_message_reactions'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('staff_message_attachments', fn (Blueprint $table) => $table->dropColumn(['storage_disk', 'sha256']));
        Schema::table('staff_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reply_to_id');
            $table->dropColumn(['important', 'edited_at', 'deleted_at', 'payload_hash', 'call_id']);
        });
        Schema::table('staff_thread_members', fn (Blueprint $table) => $table->dropColumn(['pinned', 'muted', 'typing_until']));
        Schema::dropIfExists('staff_worker_profiles');
    }
};
