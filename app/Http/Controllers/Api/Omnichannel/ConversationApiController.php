<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Omnichannel;

use App\Http\Controllers\Controller;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Omnichannel\CannedResponse;
use App\Services\Omnichannel\WhatsAppService;
use App\Services\Omnichannel\MessengerService;
use App\Services\Omnichannel\InstagramService;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\NewMessageReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ConversationApiController extends Controller
{
    /**
     * Listar conversaciones con filtros de canal, estado y búsqueda.
     */
    public function conversations(Request $request)
    {
        $query = OmnichannelConversation::with(['contact.usuario', 'assignedUser'])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('updated_at', 'desc');

        // Filtro por canal
        if ($request->filled('channel') && $request->channel !== 'all') {
            $query->where('channel', $request->channel);
        }

        // Filtro por estado
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Búsqueda por nombre de contacto o teléfono
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('contact', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone_number', 'like', '%' . $search . '%');
            });
        }

        $conversations = $query->paginate(50);

        $conversations->getCollection()->transform(function ($conv) {
            // Si el contacto tiene un usuario vinculado, usar su nombre real
            $contactName = $conv->contact->name ?? 'Desconocido';
            if ($conv->contact->usuario) {
                $realName = trim(($conv->contact->usuario->nombres ?? '') . ' ' . ($conv->contact->usuario->apellidos ?? ''));
                if ($realName) {
                    $contactName = $realName;
                }
            }

            return [
                'id' => $conv->id,
                'contactName' => $contactName,
                'initials' => strtoupper(mb_substr($contactName, 0, 2)),
                'phone' => $conv->contact->phone_number ?? null,
                'email' => $conv->contact->email ?? $conv->contact->usuario?->email ?? null,
                'channel' => $conv->channel,
                'lastMessagePreview' => $conv->last_message_preview,
                'lastMessageTime' => $conv->last_message_at?->format('H:i'),
                'lastMessageDate' => $conv->last_message_at?->format('d/m'),
                'unreadCount' => $conv->unread_count,
                'priority' => $conv->priority,
                'status' => $conv->status,
                'isBotActive' => $conv->status === 'bot_active',
                'isLinkedUser' => (bool) $conv->contact->usuario_id,
                'assignedUserId' => $conv->assigned_user_id,
                'agentName' => $conv->assignedUser?->nombres ?? null,
            ];
        });

        return response()->json($conversations);
    }

    /**
     * Listar mensajes de una conversación y marcar como leídos.
     */
    public function messages(Request $request, OmnichannelConversation $conversation)
    {
        // Marcar como leídos
        $conversation->update(['unread_count' => 0]);
        broadcast(new ConversationUpdated($conversation))->toOthers();

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->paginate(100);

        $messages->getCollection()->transform(function ($msg) {
            return $this->formatMessage($msg);
        });

        return response()->json($messages);
    }

    /**
     * Enviar un mensaje al cliente por el canal correspondiente.
     */
    public function sendMessage(Request $request, OmnichannelConversation $conversation)
    {
        $request->validate([
            'content' => 'required|string|max:4096',
        ]);
        $content = $request->input('content');

        // Crear el mensaje en BD
        $message = OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $request->user()->id,
            'channel' => $conversation->channel,
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => $content,
            'status' => 'queued',
        ]);

        // Actualizar la conversación
        $conversation->update([
            'last_message_preview' => mb_substr($content, 0, 50),
            'last_message_at' => now(),
            'message_count' => DB::raw('message_count + 1'),
        ]);

        // Enviar por el canal correspondiente
        $this->dispatchToChannel($conversation, $message, $content);

        broadcast(new NewMessageReceived($message))->toOthers();
        broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();

        return response()->json([
            'success' => true,
            'message' => $this->formatMessage($message),
        ]);
    }

    /**
     * Asignar un agente humano a la conversación.
     */
    public function assignAgent(Request $request, OmnichannelConversation $conversation)
    {
        $request->validate([
            'user_id' => 'required|integer|exists:usuario,id',
        ]);

        $conversation->update([
            'assigned_user_id' => $request->input('user_id'),
            'status' => 'human_active',
            'is_bot_paused' => true,
            'bot_paused_at' => now(),
            'bot_paused_by' => $request->user()->id,
        ]);

        // Registrar nota interna de asignación
        $agentName = \App\Models\Usuario::find($request->input('user_id'))?->nombres ?? 'Agente';
        OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $request->user()->id,
            'channel' => $conversation->channel,
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => "Conversación asignada a {$agentName}",
            'is_internal_note' => true,
            'status' => 'sent',
        ]);

        broadcast(new ConversationUpdated($conversation->load('assignedUser')))->toOthers();
        return response()->json(['success' => true]);
    }

    /**
     * Desasignar agente y devolver al bot.
     */
    public function unassignAgent(Request $request, OmnichannelConversation $conversation)
    {
        $conversation->update([
            'assigned_user_id' => null,
            'status' => 'bot_active',
            'is_bot_paused' => false,
            'bot_paused_at' => null,
            'bot_paused_by' => null,
        ]);

        broadcast(new ConversationUpdated($conversation))->toOthers();
        return response()->json(['success' => true]);
    }

    /**
     * Marcar conversación como resuelta.
     */
    public function resolveConversation(Request $request, OmnichannelConversation $conversation)
    {
        $conversation->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $request->user()->id,
        ]);

        broadcast(new ConversationUpdated($conversation))->toOthers();
        return response()->json(['success' => true]);
    }

    /**
     * Reabrir una conversación resuelta.
     */
    public function reopenConversation(Request $request, OmnichannelConversation $conversation)
    {
        $previousStatus = $conversation->assigned_user_id ? 'human_active' : 'bot_active';

        $conversation->update([
            'status' => $previousStatus,
            'resolved_at' => null,
            'resolved_by' => null,
        ]);

        broadcast(new ConversationUpdated($conversation))->toOthers();
        return response()->json(['success' => true]);
    }

    /**
     * Añadir una nota interna a la conversación.
     */
    public function addInternalNote(Request $request, OmnichannelConversation $conversation)
    {
        $request->validate(['content' => 'required|string|max:4096']);

        $message = OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $request->user()->id,
            'channel' => $conversation->channel,
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => $request->input('content'),
            'is_internal_note' => true,
            'status' => 'sent',
        ]);

        broadcast(new NewMessageReceived($message))->toOthers();

        return response()->json([
            'success' => true,
            'message' => $this->formatMessage($message),
        ]);
    }

    /**
     * Listar respuestas predefinidas activas.
     */
    public function cannedResponses(Request $request)
    {
        $query = CannedResponse::where('is_active', true);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%' . $search . '%')
                  ->orWhere('shortcut', 'like', '%' . $search . '%')
                  ->orWhere('content', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json($query->orderBy('title')->get());
    }

    /**
     * Perfil del contacto vinculado a la conversación.
     */
    public function contactProfile(OmnichannelConversation $conversation)
    {
        $contact = $conversation->contact;
        $contact->load('usuario');

        // Usar nombre real del usuario vinculado si existe
        $displayName = $contact->name;
        $displayEmail = $contact->email;
        $displayPhone = $contact->phone_number;

        if ($contact->usuario) {
            $realName = trim(($contact->usuario->nombres ?? '') . ' ' . ($contact->usuario->apellidos ?? ''));
            if ($realName) {
                $displayName = $realName;
            }
            $displayEmail = $displayEmail ?: $contact->usuario->email;
            $displayPhone = $displayPhone ?: $contact->usuario->telefono;
        }

        // Buscar el último pedido del cliente si tiene un usuario vinculado
        $lastOrder = null;
        if ($contact->usuario_id) {
            $lastOrder = \App\Models\Pedido::where('usuario_id', $contact->usuario_id)
                ->orderBy('created_at', 'desc')
                ->first(['id', 'codigo', 'total', 'estado', 'created_at']);
        }

        // Estadísticas de la conversación
        $stats = [
            'totalConversations' => OmnichannelConversation::where('contact_id', $contact->id)->count(),
            'totalMessages' => OmnichannelMessage::where('contact_id', $contact->id)->count(),
        ];

        return response()->json([
            'contact' => [
                'id' => $contact->id,
                'name' => $displayName,
                'phone' => $displayPhone,
                'email' => $displayEmail,
                'profilePicture' => $contact->profile_picture_url,
                'notes' => $contact->notes,
                'isBlocked' => $contact->is_blocked,
                'firstInteraction' => $contact->first_interaction_at?->format('d/m/Y'),
                'lastInteraction' => $contact->last_interaction_at?->format('d/m/Y H:i'),
                'linkedUserId' => $contact->usuario_id,
                'isRegisteredUser' => (bool) $contact->usuario_id,
            ],
            'lastOrder' => $lastOrder ? [
                'id' => $lastOrder->id,
                'codigo' => $lastOrder->codigo,
                'total' => $lastOrder->total,
                'estado' => $lastOrder->estado,
                'fecha' => $lastOrder->created_at->format('d/m/Y'),
            ] : null,
            'stats' => $stats,
        ]);
    }

    /**
     * Transferir conversación a bot IA.
     */
    public function transferToBot(Request $request, OmnichannelConversation $conversation)
    {
        $conversation->update([
            'status' => 'bot_active',
            'assigned_user_id' => null,
            'is_bot_paused' => false,
            'bot_paused_at' => null,
            'bot_paused_by' => null,
        ]);

        OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $request->user()->id,
            'channel' => $conversation->channel,
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => 'Conversación transferida al asistente IA',
            'is_internal_note' => true,
            'status' => 'sent',
        ]);

        broadcast(new ConversationUpdated($conversation))->toOthers();
        return response()->json(['success' => true]);
    }

    // ─── HELPERS PRIVADOS ──────────────────────────────────────

    /**
     * Formatear un mensaje para la respuesta JSON (camelCase normalizado).
     */
    private function formatMessage(OmnichannelMessage $msg): array
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $createdDate = $msg->created_at->startOfDay();

        if ($createdDate->equalTo($today)) {
            $dateFormatted = 'Hoy';
        } elseif ($createdDate->equalTo($yesterday)) {
            $dateFormatted = 'Ayer';
        } else {
            $dateFormatted = $msg->created_at->format('d/m/Y');
        }

        return [
            'id' => $msg->id,
            'direction' => $msg->direction,
            'messageType' => $msg->message_type,
            'content' => $msg->content,
            'mediaUrl' => $msg->media_url,
            'mediaMimeType' => $msg->media_mime_type,
            'time' => $msg->created_at->format('H:i'),
            'date_formatted' => $dateFormatted,
            'status' => $msg->status,
            'isInternalNote' => (bool) $msg->is_internal_note,
            'isAiGenerated' => (bool) $msg->is_ai_generated,
        ];
    }

    /**
     * Enviar el mensaje al canal correcto (WhatsApp, Messenger, Instagram).
     */
    private function dispatchToChannel(
        OmnichannelConversation $conversation,
        OmnichannelMessage $message,
        string $content
    ): void {
        try {
            $result = match ($conversation->channel) {
                'whatsapp' => $this->sendViaWhatsApp($conversation, $content),
                'messenger' => $this->sendViaMessenger($conversation, $content),
                'instagram' => $this->sendViaInstagram($conversation, $content),
                'web' => ['success' => true],
                default => ['success' => false, 'data' => ['error' => 'Canal no soportado']],
            };

            if ($result['success'] && isset($result['data']['messages'][0]['id'])) {
                $message->update([
                    'external_message_id' => $result['data']['messages'][0]['id'],
                    'status' => 'sent',
                ]);
            } elseif ($result['success']) {
                $message->update(['status' => 'sent']);
            } else {
                $errorMsg = $result['data']['error'] ?? 'Error desconocido al enviar';
                $message->update(['status' => 'failed', 'error_message' => $errorMsg]);
                Log::error('INBOX_SEND_ERROR', [
                    'channel' => $conversation->channel,
                    'error' => $errorMsg,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('INBOX_SEND_EXCEPTION', [
                'channel' => $conversation->channel,
                'error' => $e->getMessage(),
            ]);
            $message->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    private function sendViaWhatsApp(OmnichannelConversation $conversation, string $content): array
    {
        $whatsapp = app(WhatsAppService::class);
        $phone = $conversation->contact->phone_number ?? null;
        if (!$phone) {
            return ['success' => false, 'data' => ['error' => 'Sin número de teléfono']];
        }
        return $whatsapp->sendTextMessage($phone, $content);
    }

    private function sendViaMessenger(OmnichannelConversation $conversation, string $content): array
    {
        $messenger = app(MessengerService::class);
        $recipientId = $conversation->contact->messenger_id ?? null;
        if (!$recipientId) {
            return ['success' => false, 'data' => ['error' => 'Sin ID de Messenger']];
        }
        return $messenger->sendTextMessage($recipientId, $content);
    }

    private function sendViaInstagram(OmnichannelConversation $conversation, string $content): array
    {
        $instagram = app(InstagramService::class);
        $recipientId = $conversation->contact->instagram_id ?? null;
        if (!$recipientId) {
            return ['success' => false, 'data' => ['error' => 'Sin ID de Instagram']];
        }
        return $instagram->sendTextMessage($recipientId, $content);
    }
}
