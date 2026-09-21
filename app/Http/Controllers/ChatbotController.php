<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Chatbot\ChatbotMessageRequest;
use App\Services\Chatbot\ChatbotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\NewMessageReceived;
use Illuminate\Support\Facades\DB;

class ChatbotController extends Controller
{
    public function __construct(
        private readonly ChatbotService $chatbotService
    ) {}

    /**
     * Enviar un mensaje al chatbot.
     * Detecta usuario autenticado para vincular automáticamente.
     */
    public function message(ChatbotMessageRequest $request): JsonResponse
    {
        $sessionId = $request->input('session_id') ?: session()->getId();
        $messages = $request->input('messages');
        $authUser = auth()->user();
        
        // El último mensaje es el del usuario
        $lastUserMessage = end($messages)['text'] ?? '';

        try {
            DB::beginTransaction();

            // 1. Obtener o crear contacto (priorizando usuario autenticado)
            $contact = $this->resolveContact($authUser, $sessionId);

            // 2. Obtener conversación ACTIVA (no cerrada ni resuelta) o crear nueva
            $conversation = $this->resolveActiveConversation($contact);

            // 3. Guardar el mensaje del usuario entrante si hay un mensaje
            if ($lastUserMessage) {
                $inboundMessage = OmnichannelMessage::create([
                    'conversation_id' => $conversation->id,
                    'contact_id' => $contact->id,
                    'channel' => 'web',
                    'direction' => 'inbound',
                    'message_type' => 'text',
                    'content' => $lastUserMessage,
                    'status' => 'delivered',
                ]);
                
                $conversation->update([
                    'last_message_preview' => mb_substr($lastUserMessage, 0, 50),
                    'last_message_at' => now(),
                    'message_count' => DB::raw('message_count + 1'),
                    'unread_count' => DB::raw('unread_count + 1'),
                ]);

                // Actualizar última interacción del contacto
                $contact->update(['last_interaction_at' => now()]);

                broadcast(new NewMessageReceived($inboundMessage))->toOthers();
                broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();
            }

            // Si el bot no está pausado, obtener respuesta de Gemini
            $reply = '';
            if (!$conversation->is_bot_paused) {
                $reply = $this->chatbotService->getReply($messages);
                
                // Guardar mensaje del bot
                $outboundMessage = OmnichannelMessage::create([
                    'conversation_id' => $conversation->id,
                    'contact_id' => $contact->id,
                    'channel' => 'web',
                    'direction' => 'outbound',
                    'message_type' => 'text',
                    'content' => $reply,
                    'status' => 'sent',
                    'is_ai_generated' => true,
                ]);

                $conversation->update([
                    'last_message_preview' => mb_substr($reply, 0, 50),
                    'last_message_at' => now(),
                    'message_count' => DB::raw('message_count + 1'),
                ]);

                broadcast(new NewMessageReceived($outboundMessage))->toOthers();
                broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'reply' => $reply,
                'is_bot_paused' => $conversation->is_bot_paused,
                'conversation_id' => $conversation->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Error en ChatbotController: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Polling para mensajes nuevos (respuestas del agente humano).
     */
    public function pollMessages(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id') ?: session()->getId();
        $lastMessageId = $request->query('last_message_id', 0);
        $authUser = auth()->user();

        // Buscar contacto por usuario autenticado o por session_id
        $contact = $this->findContact($authUser, $sessionId);
        if (!$contact) {
            return response()->json(['messages' => []]);
        }

        $conversation = $this->findActiveConversation($contact);
        if (!$conversation) {
            return response()->json(['messages' => []]);
        }

        // Obtener nuevos mensajes posteriores al último recibido
        $newMessages = OmnichannelMessage::where('conversation_id', $conversation->id)
            ->where('id', '>', $lastMessageId)
            ->orderBy('id', 'asc')
            ->get();

        $formattedMessages = $newMessages->map(function ($msg) {
            return [
                'id' => $msg->id,
                'role' => $msg->direction === 'inbound' ? 'user' : 'bot',
                'text' => $msg->content,
                'is_human' => !$msg->is_ai_generated && $msg->direction === 'outbound',
                'time' => $msg->created_at->format('H:i'),
            ];
        });

        return response()->json([
            'messages' => $formattedMessages,
            'is_bot_paused' => $conversation->is_bot_paused,
        ]);
    }

    /**
     * Cargar historial completo de la conversación activa del visitante.
     * Se usa cuando el usuario abre el chat o refresca la página.
     */
    public function history(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id') ?: session()->getId();
        $authUser = auth()->user();

        $contact = $this->findContact($authUser, $sessionId);
        if (!$contact) {
            return response()->json(['messages' => [], 'has_active_conversation' => false]);
        }

        $conversation = $this->findActiveConversation($contact);
        if (!$conversation) {
            return response()->json(['messages' => [], 'has_active_conversation' => false]);
        }

        $messages = OmnichannelMessage::where('conversation_id', $conversation->id)
            ->where('is_internal_note', false)
            ->orderBy('id', 'asc')
            ->get();

        $formattedMessages = $messages->map(function ($msg) {
            return [
                'id' => $msg->id,
                'role' => $msg->direction === 'inbound' ? 'user' : 'bot',
                'text' => $msg->content,
                'is_human' => !$msg->is_ai_generated && $msg->direction === 'outbound',
                'time' => $msg->created_at->format('H:i'),
            ];
        });

        return response()->json([
            'messages' => $formattedMessages,
            'has_active_conversation' => true,
            'conversation_id' => $conversation->id,
            'is_bot_paused' => $conversation->is_bot_paused,
        ]);
    }

    /**
     * El visitante cierra/finaliza la conversación desde el widget.
     */
    public function closeConversation(Request $request): JsonResponse
    {
        $sessionId = $request->input('session_id') ?: session()->getId();
        $authUser = auth()->user();

        $contact = $this->findContact($authUser, $sessionId);
        if (!$contact) {
            return response()->json(['success' => true]); // nada que cerrar
        }

        $conversation = $this->findActiveConversation($contact);
        if (!$conversation) {
            return response()->json(['success' => true]);
        }

        $conversation->update([
            'status' => 'closed',
            'closed_at' => now(),
            'closed_by' => 'visitor',
        ]);

        // Nota interna para el CRM
        OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $contact->id,
            'channel' => 'web',
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => 'El visitante finalizó la conversación',
            'is_internal_note' => true,
            'status' => 'sent',
        ]);

        broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();

        return response()->json(['success' => true]);
    }

    // ─── MÉTODOS PRIVADOS ──────────────────────────────────────

    /**
     * Resolver (encontrar o crear) un contacto omnichannel.
     * Prioriza usuario autenticado para vincular nombre real.
     */
    private function resolveContact($authUser, string $sessionId): OmnichannelContact
    {
        // Si el usuario está autenticado, buscar por usuario_id primero
        if ($authUser) {
            $contact = OmnichannelContact::where('usuario_id', $authUser->id)->first();
            
            if ($contact) {
                // Actualizar nombre si cambió y vincular session_id
                $updates = [];
                $fullName = trim(($authUser->nombres ?? '') . ' ' . ($authUser->apellidos ?? ''));
                if ($fullName && $contact->name !== $fullName) {
                    $updates['name'] = $fullName;
                }
                if ($authUser->email && $contact->email !== $authUser->email) {
                    $updates['email'] = $authUser->email;
                }
                if ($authUser->telefono && $contact->phone_number !== $authUser->telefono) {
                    $updates['phone_number'] = $authUser->telefono;
                }
                // Vincular el session_id actual en metadata
                $metadata = $contact->metadata ?? [];
                $metadata['web_session_id'] = $sessionId;
                $updates['metadata'] = $metadata;

                if (!empty($updates)) {
                    $contact->update($updates);
                }

                return $contact;
            }

            // No tiene contacto aún, pero está autenticado → crear con datos reales
            $fullName = trim(($authUser->nombres ?? '') . ' ' . ($authUser->apellidos ?? ''));
            return OmnichannelContact::create([
                'name' => $fullName ?: 'Cliente Registrado',
                'email' => $authUser->email ?? null,
                'phone_number' => $authUser->telefono ?? null,
                'usuario_id' => $authUser->id,
                'metadata' => ['web_session_id' => $sessionId],
                'first_interaction_at' => now(),
                'last_interaction_at' => now(),
            ]);
        }

        // Usuario NO autenticado: buscar por session_id en metadata
        $contact = OmnichannelContact::where('metadata->web_session_id', $sessionId)->first();
        if (!$contact) {
            $contact = OmnichannelContact::create([
                'name' => 'Visitante Web',
                'phone_number' => null,
                'metadata' => ['web_session_id' => $sessionId],
                'first_interaction_at' => now(),
                'last_interaction_at' => now(),
            ]);
        }

        return $contact;
    }

    /**
     * Buscar contacto existente (sin crear).
     */
    private function findContact($authUser, string $sessionId): ?OmnichannelContact
    {
        if ($authUser) {
            return OmnichannelContact::where('usuario_id', $authUser->id)->first();
        }
        return OmnichannelContact::where('metadata->web_session_id', $sessionId)->first();
    }

    /**
     * Resolver conversación activa: buscar una que NO esté cerrada ni resuelta.
     * Si no existe, crear una nueva.
     */
    private function resolveActiveConversation(OmnichannelContact $contact): OmnichannelConversation
    {
        $conversation = OmnichannelConversation::where('contact_id', $contact->id)
            ->where('channel', 'web')
            ->whereNotIn('status', ['resolved', 'closed'])
            ->latest('updated_at')
            ->first();

        if (!$conversation) {
            $conversation = OmnichannelConversation::create([
                'contact_id' => $contact->id,
                'channel' => 'web',
                'status' => 'bot_active',
                'priority' => 'normal',
            ]);
        }

        return $conversation;
    }

    /**
     * Buscar conversación activa existente (sin crear nueva).
     */
    private function findActiveConversation(OmnichannelContact $contact): ?OmnichannelConversation
    {
        return OmnichannelConversation::where('contact_id', $contact->id)
            ->where('channel', 'web')
            ->whereNotIn('status', ['resolved', 'closed'])
            ->latest('updated_at')
            ->first();
    }
}
