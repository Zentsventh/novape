<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\NewMessageReceived;

class TransferToAgentTool implements ToolInterface
{
    private ?int $conversationId;

    public function __construct(?int $conversationId = null)
    {
        $this->conversationId = $conversationId;
    }

    public function getName(): string
    {
        return 'transferir_a_asesor';
    }

    public function getDescription(): string
    {
        return 'Transfiere la conversación a un asesor humano de atención al cliente. Usa esta función SOLAMENTE si el usuario está muy enojado, frustrado, o pide explícitamente hablar con un humano o asesor.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'OBJECT',
            'properties' => [
                'reason' => [
                    'type' => 'STRING',
                    'description' => 'El motivo por el cual se transfiere a un asesor humano.'
                ]
            ],
            'required' => ['reason']
        ];
    }

    public function execute(array $arguments): array
    {
        if (!$this->conversationId) {
            return ['error' => 'No hay una conversación activa para transferir.'];
        }

        $conversation = OmnichannelConversation::find($this->conversationId);
        
        if (!$conversation) {
            return ['error' => 'Conversación no encontrada.'];
        }

        // Obtener IDs de usuarios que están actualmente conectados (activos en los últimos 15 minutos)
        $onlineUserIds = DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>=', now()->subMinutes(15)->getTimestamp())
            ->pluck('user_id')
            ->unique();

        // Obtener solo los asesores activos que están conectados
        $asesores = Usuario::whereHas('roles', function($q) {
            $q->where('nombre', 'asesor');
        })
        ->where('estado', 'activo')
        ->whereIn('id', $onlineUserIds)
        ->get();

        if ($asesores->isEmpty()) {
            return ['success' => false, 'message' => 'En este momento todos nuestros asesores se encuentran desconectados. Por favor, deja tu mensaje o intenta de nuevo más tarde.'];
        }

        $asesorSeleccionado = null;
        $minChats = 3; // Límite máximo de chats simultáneos por asesor

        foreach ($asesores as $asesor) {
            $activeChats = OmnichannelConversation::where('assigned_user_id', $asesor->id)
                ->whereIn('status', ['human_active', 'bot_active'])
                ->where('assigned_user_id', '!=', null)
                ->whereNull('resolved_at')
                ->count();
                
            // Buscamos el asesor con menos chats, siempre que sea < 3
            if ($activeChats < $minChats) {
                $minChats = $activeChats;
                $asesorSeleccionado = $asesor;
            }
        }

        if (!$asesorSeleccionado) {
            return ['success' => false, 'message' => 'Todos nuestros asesores están ocupados atendiendo el límite máximo de chats. Por favor aguarda unos minutos o continúa interactuando conmigo.'];
        }

        // Asignar al asesor seleccionado
        $conversation->update([
            'assigned_user_id' => $asesorSeleccionado->id,
            'status' => 'human_active',
            'is_bot_paused' => true,
            'bot_paused_at' => now(),
            'bot_paused_by' => $asesorSeleccionado->id,
            'auto_assigned' => true,
        ]);

        $agentName = trim($asesorSeleccionado->nombres . ' ' . $asesorSeleccionado->apellidos);
        
        // Mensaje interno de asignación
        OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $asesorSeleccionado->id,
            'channel' => $conversation->channel,
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => "Chat asignado automáticamente al asesor {$agentName}. Motivo de transferencia: " . ($arguments['reason'] ?? 'Sin motivo especifico'),
            'is_internal_note' => true,
            'status' => 'sent',
        ]);

        // Emitir evento para el panel Omnicanal
        broadcast(new ConversationUpdated($conversation->load('assignedUser')))->toOthers();

        return [
            'success' => true, 
            'message' => "¡Listo! Te he transferido con nuestro asesor {$agentName}, quien se conectará en breve para ayudarte."
        ];
    }
}
