<?php

namespace Tests\Feature;

use App\Events\Staff\ThreadUpdated;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class PanelCommunicationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['panel_assistant.api_key' => '', 'panel_assistant.api_key_secondary' => '']);
    }

    public function test_assistant_initial_retry_is_idempotent_and_preserves_draft_history(): void
    {
        $a = $this->worker('admin');
        $data = $this->ask();
        $session = $this->actingAs($a, 'admin')->postJson('/admin/api/panel-assistant/ask', $data)->assertOk()->json('session_id');
        $this->postJson('/admin/api/panel-assistant/ask', $data)->assertOk()->assertJsonPath('session_id', $session);
        $this->assertDatabaseCount('panel_assistant_sessions', 1);
        $this->assertDatabaseCount('panel_assistant_messages', 1);
    }

    public function test_assistant_limit_is_independent_of_normal_panel_reads(): void
    {
        $a = $this->worker();
        $this->actingAs($a, 'admin');
        for ($i = 0; $i < 17; $i++) {
            $this->getJson('/admin/api/team/threads')->assertOk();
        }
        $this->postJson('/admin/api/panel-assistant/ask', $this->ask())->assertOk();
    }

    public function test_assistant_secondary_provider_recovers_primary_failure(): void
    {
        $a = $this->worker();
        config(['panel_assistant.api_key' => 'fake-primary', 'panel_assistant.api_key_secondary' => 'fake-secondary']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::sequence()->push([], 429)->push(['candidates' => [['content' => ['parts' => [['text' => 'Respuesta recuperada']]]]]])]);
        $this->actingAs($a, 'admin')->postJson('/admin/api/panel-assistant/ask', $this->ask())->assertOk()->assertJsonPath('mode', 'gemini');
        Http::assertSentCount(2);
    }

    private function worker(string $role = 'asesor', array $permissions = []): Usuario
    {
        $user = Usuario::factory()->create();
        $id = DB::table('rol')->where('nombre', $role)->value('id') ?? DB::table('rol')->insertGetId(['nombre' => $role]);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $id]);
        foreach ($permissions as $name) {
            $pid = DB::table('permiso')->where('nombre', $name)->value('id') ?? DB::table('permiso')->insertGetId(['nombre' => $name]);
            DB::table('rol_permiso')->insertOrIgnore(['rol_id' => $id, 'permiso_id' => $pid]);
        }

        return $user;
    }

    private function thread(Usuario $a, Usuario $b): int
    {
        Event::fake([ThreadUpdated::class]);

        return $this->actingAs($a, 'admin')->postJson('/admin/api/team/threads', ['members' => [$b->id]])->assertCreated()->json('id');
    }

    private function ask(array $overrides = []): array
    {
        return array_merge(['question' => 'Dame un resumen', 'intent' => 'overview', 'request_id' => (string) Str::uuid()], $overrides);
    }

    public function test_communication_requires_active_staff_guard(): void
    {
        $this->getJson('/admin/api/team/threads')->assertUnauthorized();
        $customer = $this->worker('cliente');
        $this->actingAs($customer)->getJson('/admin/api/panel-assistant/sessions')->assertUnauthorized();
        $this->actingAs($customer, 'admin')->getJson('/admin/api/team/threads')->assertForbidden();
        $this->postJson('/admin/api/panel-assistant/ask', $this->ask())->assertForbidden();
        $worker = $this->worker();
        $worker->update(['estado' => 'inactivo']);
        $this->actingAs($worker, 'admin')->getJson('/admin/api/team/threads')->assertForbidden();
    }

    public function test_direct_chat_is_reused_and_messages_are_members_only_and_idempotent(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $outsider = $this->worker();
        $id = $this->thread($a, $b);
        $this->actingAs($b, 'admin')->postJson('/admin/api/team/threads', ['members' => [$a->id]])->assertCreated()->assertJsonPath('id', $id);
        $payload = ['body' => 'Mensaje interno de prueba', 'request_id' => (string) Str::uuid()];
        $first = $this->actingAs($a, 'admin')->postJson("/admin/api/team/threads/$id/messages", $payload)->assertCreated()->json('id');
        $this->postJson("/admin/api/team/threads/$id/messages", $payload)->assertCreated()->assertJsonPath('id', $first);
        $this->assertDatabaseCount('staff_messages', 1);
        $this->assertDatabaseCount('omnichannel_messages', 0);
        $this->actingAs($outsider, 'admin')->getJson("/admin/api/team/threads/$id/messages")->assertForbidden();
        $this->postJson("/admin/api/team/threads/$id/messages", $payload)->assertForbidden();
        $this->getJson('/admin/api/team/threads')->assertJsonCount(0);
        $this->actingAs($b, 'admin')->getJson('/admin/api/team/threads')->assertJsonPath('0.unread', 1);
        $this->postJson("/admin/api/team/threads/$id/read", ['message_id' => $first])->assertOk();
        $this->getJson('/admin/api/team/threads')->assertJsonPath('0.unread', 0);
        $channels = (new ThreadUpdated($id))->broadcastOn();
        $this->assertSame(['private-novape-team.user.'.$a->id, 'private-novape-team.user.'.$b->id], array_map(fn ($c) => $c->name, $channels));
    }

    public function test_customers_and_inactive_workers_cannot_be_added_to_groups(): void
    {
        $a = $this->worker();
        $customer = $this->worker('cliente');
        $inactive = $this->worker();
        $inactive->update(['estado' => 'inactivo']);
        $this->actingAs($a, 'admin')->postJson('/admin/api/team/threads', ['members' => [$customer->id]])->assertUnprocessable();
        $this->postJson('/admin/api/team/threads', ['members' => [$inactive->id]])->assertUnprocessable();
        $this->getJson('/admin/api/team/workers')->assertJsonCount(0);
    }

    public function test_message_history_is_bounded_and_read_receipt_cannot_reference_another_thread(): void
    {
        $a = $this->worker();
        $b = $this->worker();
        $c = $this->worker();
        $id = $this->thread($a, $b);
        $other = $this->thread($a, $c);
        for ($i = 0; $i < 55; $i++) {
            DB::table('staff_messages')->insert(['thread_id' => $id, 'user_id' => $a->id, 'request_id' => (string) Str::uuid(), 'body' => 'Mensaje '.$i, 'created_at' => now(), 'updated_at' => now()]);
        }
        $data = $this->getJson("/admin/api/team/threads/$id/messages")->assertJsonCount(50, 'data')->assertJsonPath('has_more', true)->json('data');
        $this->getJson("/admin/api/team/threads/$id/messages?before=".$data[0]['id'])->assertJsonCount(5, 'data');
        $this->postJson("/admin/api/team/threads/$other/read", ['message_id' => $data[0]['id']])->assertUnprocessable();
        $this->postJson("/admin/api/team/threads/$id/messages", ['body' => '   ', 'request_id' => (string) Str::uuid()])->assertUnprocessable();
    }

    public function test_assistant_history_is_private_and_does_not_expose_unauthorized_metrics(): void
    {
        Http::preventStrayRequests();
        config(['panel_assistant.api_key' => '']);
        $a = $this->worker();
        $b = $this->worker();
        $session = $this->actingAs($a, 'admin')->postJson('/admin/api/panel-assistant/ask', $this->ask())->assertOk()->assertJsonPath('mode', 'local')->json('session_id');
        $this->getJson("/admin/api/panel-assistant/sessions/$session/messages")->assertJsonCount(1)->assertJsonFragment(['mode' => 'local']);
        $this->actingAs($b, 'admin')->getJson("/admin/api/panel-assistant/sessions/$session/messages")->assertForbidden();
        $this->postJson('/admin/api/panel-assistant/ask', $this->ask(['session_id' => $session]))->assertForbidden();
        $this->getJson('/admin/api/panel-assistant/sessions')->assertJsonCount(0);
        Http::assertNothingSent();
    }

    public function test_assistant_conversation_context_respects_assignment_and_never_sends_to_customer(): void
    {
        config(['panel_assistant.api_key' => '']);
        Http::preventStrayRequests();
        $a = $this->worker('asesor', ['gestionar_omnichannel']);
        $b = $this->worker();
        $contact = OmnichannelContact::create(['name' => 'Cliente de prueba']);
        $conv = OmnichannelConversation::create(['contact_id' => $contact->id, 'assigned_user_id' => $a->id, 'channel' => 'whatsapp', 'status' => 'human_active']);
        OmnichannelMessage::create(['conversation_id' => $conv->id, 'contact_id' => $contact->id, 'channel' => 'whatsapp', 'direction' => 'inbound', 'message_type' => 'text', 'content' => 'Necesito seguimiento', 'status' => 'delivered']);
        $payload = $this->ask(['intent' => 'draft', 'conversation_id' => $conv->id]);
        $response = $this->actingAs($a, 'admin')->postJson('/admin/api/panel-assistant/ask', $payload)->assertOk()->assertJsonPath('is_draft', true);
        $this->postJson('/admin/api/panel-assistant/ask', $payload + ['session_id' => $response->json('session_id')])->assertOk();
        $this->actingAs($b, 'admin')->postJson('/admin/api/panel-assistant/ask', $this->ask(['intent' => 'summary', 'conversation_id' => $conv->id]))->assertForbidden();
        $this->assertDatabaseCount('omnichannel_messages', 1);
        Http::assertNothingSent();
    }

    public function test_provider_receives_only_authorized_context_and_failure_has_local_fallback(): void
    {
        $a = $this->worker('asesor', ['gestionar_omnichannel']);
        config(['panel_assistant.api_key' => 'fake-panel-key']);
        Http::fake(['generativelanguage.googleapis.com/*' => Http::sequence()->push(['candidates' => [['content' => ['parts' => [['text' => 'Resumen autorizado']]]]]])->push([], 503)]);
        $this->actingAs($a, 'admin')->postJson('/admin/api/panel-assistant/ask', $this->ask())->assertOk()->assertJsonPath('mode', 'gemini');
        Http::assertSent(fn ($r) => $r->hasHeader('x-goog-api-key', 'fake-panel-key') && ! str_contains($r->body(), $a->password_hash) && ! str_contains($r->body(), $a->email));
        $this->postJson('/admin/api/panel-assistant/ask', $this->ask())->assertOk()->assertJsonPath('mode', 'local_fallback');
    }
}
