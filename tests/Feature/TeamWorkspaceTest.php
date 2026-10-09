<?php

namespace Tests\Feature;

use App\Events\Staff\CallUpdated;
use App\Events\Staff\ThreadUpdated;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class TeamWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake([ThreadUpdated::class, CallUpdated::class]);
        Storage::fake('local');
    }

    private function worker(string $role = 'asesor'): Usuario
    {
        $user = Usuario::factory()->create();
        $id = DB::table('rol')->where('nombre', $role)->value('id') ?? DB::table('rol')->insertGetId(['nombre' => $role]);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $id]);

        return $user;
    }

    private function thread(Usuario $host, array $members, bool $group = false): int
    {
        return $this->actingAs($host, 'admin')->postJson('/admin/api/team/threads', ['members' => array_map(fn ($u) => $u->id, $members), 'is_group' => $group, 'title' => 'Equipo de prueba'])->assertCreated()->json('id');
    }

    private function createCall(int $thread, array $extra = []): array
    {
        return $this->postJson("/admin/api/team/threads/$thread/call", $extra + ['request_id' => (string) Str::uuid(), 'client_id' => (string) Str::uuid(), 'kind' => 'video'])->assertCreated()->json();
    }

    public function test_direct_chat_reuses_thread_and_extensions_are_unique_and_searchable(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $this->worker('cliente');
        $id = $this->thread($a, [$b]);
        $this->assertSame($id, $this->thread($b, [$a]));
        $workers = $this->getJson('/admin/api/team/workers')->assertOk()->assertJsonCount(2)->json();
        $this->assertCount(2, array_unique(array_column($workers, 'extension')));
        $extension = (string) (10000 + $a->id);
        $this->getJson('/admin/api/team/workers?q='.$extension)->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $a->id);
        $this->postJson('/admin/api/team/presence', ['availability' => 'busy'])->assertOk()->assertJsonPath('extension', (string) (10000 + $b->id));
    }

    public function test_call_polling_is_not_blocked_by_the_general_panel_limit(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $this->actingAs($a, 'admin');
        for ($i = 0; $i < 75; $i++) $this->getJson('/admin/api/team/call-config')->assertOk();
        $this->actingAs($b, 'admin')->getJson('/admin/api/team/call-config')->assertOk();
    }

    public function test_private_files_idempotency_and_deleted_message_access(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $outsider = $this->worker('admin');
        $thread = $this->thread($a, [$b]);
        $key = (string) Str::uuid();
        $payload = ['request_id' => $key, 'body' => 'Documento', 'attachments' => [UploadedFile::fake()->createWithContent('informe.txt', 'Informe privado del equipo')]];
        $message = $this->post("/admin/api/team/threads/$thread/messages", $payload, ['Accept' => 'application/json'])->assertCreated()->json();
        $this->post("/admin/api/team/threads/$thread/messages", $payload, ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('id', $message['id']);
        $this->assertDatabaseCount('staff_message_attachments', 1);
        $this->assertDatabaseHas('staff_message_attachments', ['storage_disk' => 'local']);
        $url = $message['attachments'][0]['url'];
        $this->actingAs($b, 'admin')->get($url)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->actingAs($outsider, 'admin')->getJson($url)->assertForbidden();
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/threads/$thread/messages", ['request_id' => $key, 'body' => 'Otro contenido'])->assertConflict();
        $this->postJson("/admin/api/team/threads/$thread/messages/{$message['id']}/delete")->assertOk();
        $this->getJson($url)->assertNotFound();
    }

    public function test_replies_edits_reactions_and_read_receipts_respect_membership(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $c = $this->worker();
        $thread = $this->thread($a, [$b]);
        $id = $this->postJson("/admin/api/team/threads/$thread/messages", ['body' => '0', 'request_id' => (string) Str::uuid()])->assertCreated()->json('id');
        $other = $this->thread($a, [$c]);
        $this->postJson("/admin/api/team/threads/$other/messages", ['body' => 'Cita privada', 'reply_to_id' => $id, 'request_id' => (string) Str::uuid()])->assertUnprocessable();
        $this->actingAs($b, 'admin')->postJson("/admin/api/team/threads/$thread/messages/$id/edit", ['body' => 'Modificación ajena'])->assertForbidden();
        for ($i = 0; $i < 2; $i++) {
            $this->postJson("/admin/api/team/threads/$thread/messages/$id/reaction", ['emoji' => '👍', 'active' => true])->assertOk();
        }
        $this->assertDatabaseCount('staff_message_reactions', 1);
        $this->postJson("/admin/api/team/threads/$thread/read", ['message_id' => $id])->assertOk();
        $this->assertDatabaseHas('staff_thread_members', ['thread_id' => $thread, 'user_id' => $b->id, 'last_read_id' => $id]);
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/threads/$thread/messages/$id/edit", ['body' => 'Mensaje corregido'])->assertOk();
        $this->getJson("/admin/api/team/threads/$thread/messages")->assertOk()->assertJsonPath('data.0.body', 'Mensaje corregido')->assertJsonPath('data.0.reactions.0.count', 1);
    }

    public function test_calls_exchange_only_private_signals_and_end_for_everyone(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $c = $this->worker('admin');
        $thread = $this->thread($a, [$b]);
        $aClient = (string) Str::uuid();
        $bClient = (string) Str::uuid();
        $call = $this->createCall($thread, ['client_id' => $aClient]);
        $id = $call['id'];
        $this->actingAs($c, 'admin')->getJson("/admin/api/team/calls/$id")->assertForbidden();
        $this->actingAs($b, 'admin')->postJson("/admin/api/team/calls/$id/join", ['client_id' => $bClient, 'video_enabled' => true])->assertOk()->assertJsonPath('status', 'active');
        $this->postJson("/admin/api/team/calls/$id/leave", ['end_for_all' => true])->assertForbidden();
        $payload = ['client_id' => $aClient, 'request_id' => (string) Str::uuid(), 'target_id' => $b->id, 'kind' => 'offer', 'payload' => ['type' => 'offer', 'sdp' => 'v=0\r\n']];
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/calls/$id/signal", $payload)->assertOk();
        $this->postJson("/admin/api/team/calls/$id/signal", $payload)->assertOk();
        $this->postJson("/admin/api/team/calls/$id/signal", array_replace($payload, ['target_id' => (string) $a->id]))->assertForbidden();
        $this->getJson("/admin/api/team/calls/$id?client_id=$aClient")->assertOk()->assertJsonCount(0, 'signals');
        $this->actingAs($b, 'admin')->getJson("/admin/api/team/calls/$id?client_id=$bClient")->assertOk()->assertJsonCount(1, 'signals')->assertJsonPath('signals.0.from_id', $a->id);
        $this->getJson('/admin/api/team/calls/'.$id.'?client_id='.Str::uuid())->assertConflict();
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/calls/$id/leave", ['end_for_all' => true])->assertOk();
        $this->getJson("/admin/api/team/calls/$id")->assertOk()->assertJsonPath('call.status', 'ended');
        $this->assertDatabaseCount('staff_messages', 1);
    }

    public function test_busy_capacity_and_scheduled_meeting_time_zone(): void
    {
        config(['team.max_participants' => 2]);
        $a = $this->worker();
        $b = $this->worker();
        $c = $this->worker();
        $thread = $this->thread($a, [$b, $c], true);
        $call = $this->createCall($thread);
        $id = $call['id'];
        $this->actingAs($b, 'admin')->postJson("/admin/api/team/calls/$id/join", ['client_id' => (string) Str::uuid(), 'video_enabled' => false])->assertOk();
        $this->actingAs($c, 'admin')->postJson("/admin/api/team/calls/$id/join", ['client_id' => (string) Str::uuid(), 'video_enabled' => false])->assertConflict();
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/calls/$id/leave", ['end_for_all' => true])->assertOk();
        $instant = now()->addDays(2)->utc()->startOfSecond();
        $meeting = $this->createCall($thread, ['scheduled_at' => $instant->toIso8601String(), 'title' => 'Planificación']);
        $this->assertTrue(Carbon::parse($meeting['scheduled_at'])->equalTo($instant));
        $this->actingAs($b, 'admin')->postJson('/admin/api/team/calls/'.$meeting['id'].'/join', ['client_id' => (string) Str::uuid(), 'video_enabled' => true])->assertUnprocessable();
    }

    public function test_request_collision_is_rejected_and_abandoned_call_expires(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $thread = $this->thread($a, [$b]);
        $key = (string) Str::uuid();
        $this->postJson("/admin/api/team/threads/$thread/messages", ['body' => 'Mensaje', 'request_id' => $key])->assertCreated();
        $this->postJson("/admin/api/team/threads/$thread/call", ['kind' => 'audio', 'request_id' => $key, 'client_id' => (string) Str::uuid()])->assertConflict();
        $call = $this->createCall($thread);
        $this->travel(100)->seconds();
        $this->getJson('/admin/api/team/calls/'.$call['id'])->assertOk()->assertJsonPath('call.status', 'ended')->assertJsonPath('call.end_reason', 'missed');
    }

    public function test_group_membership_updates_invitations_and_revokes_private_access(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $c = $this->worker();
        $d = $this->worker();
        $thread = $this->thread($a, [$b, $c], true);
        $call = $this->createCall($thread, ['scheduled_at' => now()->addDay()->toIso8601String()]);
        $message = $this->post("/admin/api/team/threads/$thread/messages", ['request_id' => (string) Str::uuid(), 'attachments' => [UploadedFile::fake()->createWithContent('private.txt', 'Privado')]], ['Accept' => 'application/json'])->assertCreated()->json();
        $this->actingAs($b, 'admin')->postJson("/admin/api/team/threads/$thread/manage", ['title' => 'No autorizado', 'members' => [$a->id, $b->id]])->assertForbidden();
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/threads/$thread/manage", ['title' => '  ', 'members' => [$a->id, $c->id]])->assertUnprocessable();
        $this->postJson("/admin/api/team/threads/$thread/manage", ['title' => 'Equipo actualizado', 'members' => [$a->id, $c->id, $d->id], 'owner_id' => $d->id])->assertOk();
        $this->assertDatabaseHas('staff_call_participants', ['call_id' => $call['id'], 'user_id' => $d->id, 'state' => 'invited']);
        $this->actingAs($b, 'admin')->getJson($message['attachments'][0]['url'])->assertForbidden();
        $this->getJson("/admin/api/team/threads/$thread/messages")->assertForbidden();
        $this->postJson("/admin/api/team/threads/$thread/read", ['message_id' => $message['id']])->assertForbidden();
        $this->getJson('/admin/api/team/calls/'.$call['id'])->assertForbidden();
        $this->actingAs($a, 'admin')->postJson("/admin/api/team/threads/$thread/manage", ['title' => 'Ya no responsable', 'members' => [$a->id, $c->id]])->assertForbidden();
        $this->actingAs($d, 'admin')->postJson("/admin/api/team/threads/$thread/leave")->assertOk();
        $this->assertDatabaseHas('staff_threads', ['id' => $thread, 'created_by' => min($a->id, $c->id)]);
        $this->getJson("/admin/api/team/threads/$thread/messages")->assertForbidden();
    }

    public function test_archive_and_preferences_are_personal_and_reads_do_not_move_backwards(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $thread = $this->thread($a, [$b]);
        $ids = [];
        for ($i = 0; $i < 2; $i++) $ids[] = $this->postJson("/admin/api/team/threads/$thread/messages", ['body' => "Mensaje $i", 'request_id' => (string) Str::uuid()])->assertCreated()->json('id');
        $this->postJson("/admin/api/team/threads/$thread/preferences", ['archived' => true, 'muted' => true, 'pinned' => true])->assertOk();
        $this->getJson('/admin/api/team/threads')->assertOk()->assertJsonPath('0.archived', 1);
        $this->actingAs($b, 'admin')->getJson('/admin/api/team/threads')->assertOk()->assertJsonPath('0.archived', 0)->assertJsonPath('0.unread', 2);
        $this->postJson("/admin/api/team/threads/$thread/read", ['message_id' => $ids[1]])->assertOk();
        $this->postJson("/admin/api/team/threads/$thread/read", ['message_id' => $ids[0]])->assertOk();
        $this->assertDatabaseHas('staff_thread_members', ['thread_id' => $thread, 'user_id' => $b->id, 'last_read_id' => $ids[1]]);
        $this->postJson("/admin/api/team/threads/$thread/leave")->assertUnprocessable();
    }

    public function test_meetings_can_be_rescheduled_and_cancelled_only_by_the_host(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $thread = $this->thread($a, [$b]);
        $call = $this->createCall($thread, ['scheduled_at' => now()->addDays(2)->toIso8601String()]);
        $url = '/admin/api/team/calls/'.$call['id'].'/meeting';
        $this->actingAs($b, 'admin')->postJson($url, ['cancel' => true])->assertForbidden();
        $this->actingAs($a, 'admin')->postJson($url, ['title' => 'Reprogramada', 'scheduled_at' => now()->addDays(3)->toIso8601String()])->assertOk()->assertJsonPath('title', 'Reprogramada');
        $this->postJson($url, ['cancel' => false])->assertUnprocessable();
        $this->postJson($url, ['title' => '  ', 'scheduled_at' => now()->addDay()->toIso8601String()])->assertUnprocessable();
        $this->postJson($url, ['cancel' => true])->assertOk()->assertJsonPath('status', 'ended')->assertJsonPath('end_reason', 'cancelled');
        $this->postJson($url, ['cancel' => true])->assertConflict();
        $this->postJson('/admin/api/team/calls/'.$call['id'].'/join', ['client_id' => (string) Str::uuid(), 'video_enabled' => true])->assertConflict();
        $this->assertDatabaseHas('staff_activity_log', ['thread_id' => $thread, 'action' => 'meeting_cancelled']);
    }

    public function test_loaded_message_refresh_is_private_and_includes_old_edits_and_deletions(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $c = $this->worker();
        $thread = $this->thread($a, [$b]);
        $old = $this->postJson("/admin/api/team/threads/$thread/messages", ['body' => '0', 'request_id' => (string) Str::uuid()])->assertCreated()->json('id');
        $other = $this->thread($a, [$c]);
        $private = $this->postJson("/admin/api/team/threads/$other/messages", ['body' => 'Secreto', 'request_id' => (string) Str::uuid()])->assertCreated()->json('id');
        $this->postJson("/admin/api/team/threads/$thread/messages/$old/edit", ['body' => 'Texto cambiado'])->assertOk();
        $this->getJson("/admin/api/team/threads/$thread/messages?ids[]=$old&ids[]=$private")->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.body', 'Texto cambiado');
        $this->getJson("/admin/api/team/threads/$thread/messages?q=0")->assertOk()->assertJsonCount(0, 'data');
        $this->postJson("/admin/api/team/threads/$thread/messages/$old/delete")->assertOk();
        $this->getJson("/admin/api/team/threads/$thread/messages?ids[]=$old")->assertOk()->assertJsonPath('data.0.body', null);
        $this->getJson("/admin/api/team/threads/$thread/messages?ids[]=$old&q=Texto")->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_maintenance_expires_calls_without_an_authenticated_session(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $thread = $this->thread($a, [$b]);
        $call = $this->createCall($thread);
        auth('admin')->logout();
        $this->travel(100)->seconds();
        $this->artisan('team:maintenance')->assertSuccessful();
        $this->assertDatabaseHas('staff_calls', ['id' => $call['id'], 'status' => 'ended']);
        $this->assertDatabaseHas('staff_activity_log', ['thread_id' => $thread, 'action' => 'call_ended']);
    }
}
