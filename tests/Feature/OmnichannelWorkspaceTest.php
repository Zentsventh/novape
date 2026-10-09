<?php

namespace Tests\Feature;

use App\Events\Omnichannel\ConversationUpdated;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class OmnichannelWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private function staff(string $role = 'admin'): Usuario
    {
        $user = Usuario::factory()->create();
        $roleId = DB::table('rol')->where('nombre', $role)->value('id') ?? DB::table('rol')->insertGetId(['nombre' => $role]);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $roleId]);
        if ($role !== 'admin') {
            $permissionId = DB::table('permiso')->where('nombre', 'gestionar_omnichannel')->value('id') ?? DB::table('permiso')->insertGetId(['nombre' => 'gestionar_omnichannel']);
            DB::table('rol_permiso')->insertOrIgnore(['rol_id' => $roleId, 'permiso_id' => $permissionId]);
        }

        return $user;
    }

    private function conversation(array $attributes = []): OmnichannelConversation
    {
        $contact = OmnichannelContact::create(['name' => 'Cliente de prueba']);

        return OmnichannelConversation::create(array_merge(['contact_id' => $contact->id, 'channel' => 'whatsapp', 'status' => 'open', 'priority' => 'normal', 'last_message_at' => now()], $attributes));
    }

    public function test_counts_include_all_pages_and_views_sort_real_records(): void
    {
        $user = $this->staff();
        for ($i = 0; $i < 51; $i++) {
            $this->conversation(['assigned_user_id' => $user->id]);
        }
        $urgent = $this->conversation(['priority' => 'urgent', 'status' => 'waiting', 'unread_count' => 3]);
        $this->conversation(['status' => 'closed']);
        $this->actingAs($user, 'admin')->getJson('/admin/api/omnichannel/conversations?status=open&sort=priority')
            ->assertOk()->assertJsonPath('total', 52)->assertJsonCount(50, 'data')->assertJsonPath('summary.open', 52)
            ->assertJsonPath('summary.mine', 51)->assertJsonPath('summary.closed', 1)->assertJsonPath('summary.waiting', 1)
            ->assertJsonPath('channels.whatsapp', 52)->assertJsonPath('data.0.id', $urgent->id);
        $this->getJson('/admin/api/omnichannel/conversations?status=open&page=2')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/admin/api/omnichannel/conversations?status=open&view=waiting')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $urgent->id);
    }

    public function test_agent_counts_and_priority_updates_respect_assignment_and_permissions(): void
    {
        Event::fake([ConversationUpdated::class]);
        $agent = $this->staff('asesor');
        $other = $this->staff();
        $own = $this->conversation(['assigned_user_id' => $agent->id]);
        $foreign = $this->conversation(['assigned_user_id' => $other->id, 'priority' => 'urgent']);
        $this->conversation();
        $this->actingAs($agent, 'admin')->getJson('/admin/api/omnichannel/conversations?status=open')->assertOk()
            ->assertJsonPath('total', 1)->assertJsonPath('summary.open', 1)->assertJsonPath('summary.priority', 0)->assertJsonPath('summary.unassigned', 0);
        $this->postJson("/admin/api/omnichannel/conversations/{$own->id}/priority", ['priority' => 'high'])->assertOk();
        $this->assertSame('high', $own->fresh()->priority);
        $this->assertDatabaseHas('omnichannel_audit_logs', ['conversation_id' => $own->id, 'user_id' => $agent->id, 'action' => 'priority_changed']);
        $this->postJson("/admin/api/omnichannel/conversations/{$foreign->id}/priority", ['priority' => 'low'])->assertForbidden();
        $this->postJson("/admin/api/omnichannel/conversations/{$own->id}/priority", ['priority' => 'invalid'])->assertUnprocessable();
        $this->assertSame('urgent', $foreign->fresh()->priority);
    }

    public function test_realtime_failure_does_not_turn_a_persisted_priority_into_a_server_error(): void
    {
        $user = $this->staff();
        $conversation = $this->conversation();
        Event::listen(ConversationUpdated::class, fn () => throw new \RuntimeException('Realtime unavailable'));
        $this->actingAs($user, 'admin')->postJson("/admin/api/omnichannel/conversations/{$conversation->id}/priority", ['priority' => 'urgent'])
            ->assertOk()->assertJsonPath('success', true);
        $this->assertSame('urgent', $conversation->fresh()->priority);
    }

    public function test_linked_customer_identity_is_searchable_and_history_keeps_older_messages_accessible(): void
    {
        Event::fake([ConversationUpdated::class]);
        $staff = $this->staff();
        $customer = Usuario::factory()->create(['nombres' => 'Marisol']);
        $conversation = $this->conversation(['unread_count' => 2]);
        $conversation->contact->update(['usuario_id' => $customer->id]);
        $this->actingAs($staff, 'admin')->getJson('/admin/api/omnichannel/conversations?status=open&search=Marisol')
            ->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $conversation->id);
        for ($i = 0; $i < 101; $i++) {
            OmnichannelMessage::create(['conversation_id' => $conversation->id, 'contact_id' => $conversation->contact_id, 'channel' => 'whatsapp', 'direction' => 'inbound', 'message_type' => 'text', 'content' => 'Mensaje '.$i, 'status' => 'delivered']);
        }
        $this->getJson("/admin/api/omnichannel/conversations/{$conversation->id}/messages")->assertOk()->assertJsonCount(100, 'data')->assertJsonPath('data.0.content', 'Mensaje 1')->assertJsonPath('last_page', 2);
        $this->getJson("/admin/api/omnichannel/conversations/{$conversation->id}/messages?page=2")->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.content', 'Mensaje 0');
        $this->assertSame(0, $conversation->fresh()->unread_count);
        Event::assertDispatchedTimes(ConversationUpdated::class, 1);
    }

    public function test_supervisor_can_claim_and_closed_conversations_reject_customer_replies(): void
    {
        Event::fake([ConversationUpdated::class]);
        $supervisor = $this->staff();
        $conversation = $this->conversation();
        $this->actingAs($supervisor, 'admin')->postJson("/admin/api/omnichannel/conversations/{$conversation->id}/assign", ['user_id' => $supervisor->id])->assertOk();
        $this->assertSame($supervisor->id, $conversation->fresh()->assigned_user_id);
        $this->assertSame('human_active', $conversation->fresh()->status);
        $conversation->update(['status' => 'closed']);
        $before = OmnichannelMessage::count();
        $this->postJson("/admin/api/omnichannel/conversations/{$conversation->id}/messages", ['content' => 'No debe enviarse'])->assertUnprocessable();
        $this->assertSame($before, OmnichannelMessage::count());
    }
}
