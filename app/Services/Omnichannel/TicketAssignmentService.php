<?php

namespace App\Services\Omnichannel;

use App\Models\Crm\CrmCase;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TicketAssignmentService
{
    /**
     * Hand-off a human agent using Round-Robin assignment.
     */
    public function handoffToHuman(OmnichannelConversation $conversation): void
    {
        if ($conversation->assigned_user_id) {
            // Ya está asignado a alguien, solo crear caso si no hay
            $this->createCaseForConversation($conversation, $conversation->assigned_user_id);
            return;
        }

        try {
            DB::beginTransaction();

            // 1. Buscar agente disponible (Round-Robin simple: el que tenga menos casos abiertos)
            $availableAgent = Usuario::whereHas('roles', function ($query) {
                    $query->whereIn('rol.id', [1, 2]); // Admin o Staff
                })
                ->withCount(['crmCases as open_cases_count' => function ($query) {
                    $query->where('estado', 'abierto')->orWhere('estado', 'en_progreso');
                }])
                ->orderBy('open_cases_count', 'asc')
                ->first();

            $agentId = $availableAgent ? $availableAgent->id : null;

            // 2. Asignar conversación
            $conversation->update([
                'assigned_user_id' => $agentId,
                'is_bot_paused' => true,
                'bot_paused_at' => now(),
            ]);

            // 3. Crear Caso (Ticket)
            $this->createCaseForConversation($conversation, $agentId);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en TicketAssignmentService: ' . $e->getMessage());
        }
    }

    public function createCaseForConversation(OmnichannelConversation $conversation, ?int $agentId): void
    {
        // Buscar si ya existe un caso abierto para esta conversación
        // Dado que no hay un campo directo conversation_id en crm_cases, vincularemos al cliente
        // Si tienes una forma de vincular el caso al conversation (ej, deal_id o campo custom), puedes hacerlo.
        // Por ahora, creamos el ticket asociado al cliente.
        
        // Verifica si el cliente ya tiene un caso abierto de "consulta"
        $existingCase = CrmCase::where('cliente_id', $conversation->contact->usuario_id ?? null)
            ->whereIn('estado', ['abierto', 'en_progreso'])
            ->first();

        if (!$existingCase && $conversation->contact->usuario_id) {
            CrmCase::create([
                'titulo'      => 'Soporte vía Chat Omnicanal',
                'descripcion' => 'Transferido desde el Chatbot. Último mensaje: ' . $conversation->last_message_preview,
                'tipo'        => 'consulta',
                'estado'      => 'abierto',
                'prioridad'   => 'media',
                'cliente_id'  => $conversation->contact->usuario_id,
                'asignado_a'  => $agentId,
            ]);
        }
    }
}
