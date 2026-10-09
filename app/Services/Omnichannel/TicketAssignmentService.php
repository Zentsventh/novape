<?php

namespace App\Services\Omnichannel;

use App\Models\CrmCase;
use App\Models\Omnichannel\OmnichannelAuditLog;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelQueue;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketAssignmentService
{
    /**
     * Intenta asignar una conversación a un asesor humano.
     * Si no hay asesores disponibles o todos superaron su límite, entra a cola.
     */
    public function handoffToHuman(OmnichannelConversation $conversation): void
    {
        if ($conversation->assigned_user_id) {
            // Ya está asignado a alguien, solo reabrir si estaba cerrado
            if (in_array($conversation->status, ['resolved', 'closed'])) {
                $conversation->update(['status' => 'human_active']);
            }

            return;
        }

        try {
            DB::beginTransaction();

            // 1. Obtener todos los agentes ONLINE con sus límites y conteo de chats activos
            $availableAgent = Usuario::whereHas('roles', function ($query) {
                $query->where('nombre', 'admin')->orWhereHas('permisos', fn ($p) => $p->where('nombre', 'gestionar_omnichannel'));
            })
                ->whereHas('omnichannelConfig', function ($query) {
                    $query->where('status', 'online');
                })
                ->with('omnichannelConfig')
                ->withCount(['omnichannelConversations as active_chats_count' => function ($query) {
                    // Contamos los chats que están siendo atendidos actualmente
                    $query->whereIn('status', ['open', 'human_active', 'waiting']);
                }])
                ->get()
                // 2. Filtrar los que ya llegaron a su límite máximo
                ->filter(function ($agent) {
                    $max = $agent->omnichannelConfig ? $agent->omnichannelConfig->max_chats : 5;

                    return $agent->getAttribute('active_chats_count') < $max;
                })
                // 3. Ordenar por los que tienen menos carga (Round-Robin)
                ->sortBy('active_chats_count')
                ->first();

            if ($availableAgent) {
                // Hay un asesor disponible: Asignar
                $conversation->update([
                    'assigned_user_id' => $availableAgent->id,
                    'status' => 'human_active',
                    'is_bot_paused' => true,
                    'bot_paused_at' => now(),
                    'waiting_since' => null,
                ]);

                // Crear o vincular Caso CRM
                $this->createCaseForConversation($conversation, $availableAgent->id);

                // Aquí se podría disparar un Evento / WebSocket a $availableAgent
            } else {
                // No hay asesores disponibles: Mandar a la Cola
                $conversation->update([
                    'status' => 'waiting',
                    'is_bot_paused' => true,
                    'bot_paused_at' => now(),
                    'waiting_since' => now(),
                ]);

                OmnichannelQueue::firstOrCreate([
                    'conversation_id' => $conversation->id,
                ], [
                    'priority' => $conversation->priority ?? 'normal',
                ]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en TicketAssignmentService: '.$e->getMessage());
        }
    }

    public function createCaseForConversation(OmnichannelConversation $conversation, ?int $agentId): void
    {
        if (! $conversation->contact || ! $conversation->contact->usuario_id) {
            return;
        }

        // Verifica si el cliente ya tiene un caso abierto asociado a esta conversación o genérico
        $existingCase = CrmCase::where('cliente_id', $conversation->contact->usuario_id)
            ->where(function ($q) use ($conversation) {
                $q->where('omnichannel_conversation_id', $conversation->id)
                    ->orWhereIn('estado', ['abierto', 'en_progreso']);
            })
            ->first();

        if (! $existingCase) {
            CrmCase::create([
                'titulo' => 'Soporte vía Chat Omnicanal ('.strtoupper($conversation->channel).')',
                'descripcion' => 'Transferido desde el Chatbot. Último mensaje: '.$conversation->last_message_preview,
                'tipo' => 'consulta',
                'estado' => 'abierto',
                'prioridad' => 'media',
                'cliente_id' => $conversation->contact->usuario_id,
                'asignado_a' => $agentId,
                'omnichannel_conversation_id' => $conversation->id,
            ]);
        }
    }

    /**
     * Procesar la cola de espera para un agente que acaba de liberarse
     */
    public function processQueueForAgent(Usuario $agent): void
    {
        // 1. Verificar si está online
        if (! $agent->omnichannelConfig || $agent->omnichannelConfig->status !== 'online') {
            return;
        }

        // 2. Verificar si tiene capacidad
        $max = $agent->omnichannelConfig->max_chats ?? 5;
        $activeChats = $agent->omnichannelConversations()
            ->whereIn('status', ['open', 'human_active', 'waiting'])
            ->count();

        if ($activeChats >= $max) {
            return; // Aún está lleno
        }

        $freeSlots = $max - $activeChats;

        // 3. Tomar de la cola (ordenando por prioridad o fecha)
        // Podrías ordenar por: FIELD(priority, 'urgent', 'high', 'normal', 'low') DESC, queued_at ASC
        $queueItems = OmnichannelQueue::with('conversation')
            ->orderByRaw("FIELD(priority, 'urgent', 'high', 'normal', 'low') DESC")
            ->orderBy('queued_at', 'asc')
            ->limit($freeSlots)
            ->get();

        foreach ($queueItems as $item) {
            $conversation = $item->conversation;

            // Asignar
            $conversation->update([
                'assigned_user_id' => $agent->id,
                'status' => 'human_active',
                'is_bot_paused' => true,
                'bot_paused_at' => now(),
            ]);

            $this->createCaseForConversation($conversation, $agent->id);

            // Eliminar de la cola
            $item->delete();
        }
    }

    /**
     * Transfiere una conversación a otro asesor
     */
    public function transferConversation(OmnichannelConversation $conversation, Usuario $toUser, Usuario $fromUser, string $reason = ''): void
    {
        try {
            DB::beginTransaction();

            $conversation->update([
                'assigned_user_id' => $toUser->id,
                'status' => 'human_active',
            ]);

            OmnichannelAuditLog::create([
                'conversation_id' => $conversation->id,
                'user_id' => $fromUser->id,
                'action' => 'transfer',
                'description' => "Transferido a {$toUser->nombre_completo}. Motivo: {$reason}",
                'meta_data' => [
                    'from' => $fromUser->id,
                    'to' => $toUser->id,
                    'reason' => $reason,
                ],
            ]);

            // Re-asignar el Caso CRM también
            $case = CrmCase::where('omnichannel_conversation_id', $conversation->id)->first();
            if ($case) {
                $case->update(['asignado_a' => $toUser->id]);
            }

            // Procesar la cola del agente antiguo (ahora tiene un espacio libre)
            $this->processQueueForAgent($fromUser);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en Transferencia: '.$e->getMessage());
        }
    }

    /**
     * Cierra una conversación
     */
    public function closeConversation(OmnichannelConversation $conversation, Usuario $closedBy, string $reason = 'Consulta Resuelta'): void
    {
        try {
            DB::beginTransaction();

            $oldAgentId = $conversation->assigned_user_id;

            $conversation->update([
                'status' => 'closed',
                'closed_at' => now(),
                'closed_by' => $closedBy->id,
                'close_reason' => $reason,
            ]);

            OmnichannelAuditLog::create([
                'conversation_id' => $conversation->id,
                'user_id' => $closedBy->id,
                'action' => 'close',
                'description' => "Conversación cerrada. Motivo: {$reason}",
                'meta_data' => ['reason' => $reason],
            ]);

            $case = CrmCase::where('omnichannel_conversation_id', $conversation->id)
                ->whereIn('estado', ['abierto', 'en_progreso'])
                ->first();
            if ($case) {
                $case->update(['estado' => 'resuelto']);
            }

            if ($oldAgentId) {
                $oldAgent = Usuario::find($oldAgentId);
                if ($oldAgent) {
                    $this->processQueueForAgent($oldAgent);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al cerrar conversación: '.$e->getMessage());
        }
    }
}
