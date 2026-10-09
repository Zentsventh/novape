<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Omnichannel;

use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\NewMessageReceived;
use App\Http\Controllers\Controller;
use App\Models\CrmCase;
use App\Models\Omnichannel\CannedResponse;
use App\Models\Omnichannel\OmnichannelAgentConfig;
use App\Models\Omnichannel\OmnichannelAuditLog;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Omnichannel\OmnichannelQueue;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Services\Omnichannel\ConversationAccess;
use App\Services\Omnichannel\InstagramService;
use App\Services\Omnichannel\MessengerService;
use App\Services\Omnichannel\TicketAssignmentService;
use App\Services\Omnichannel\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConversationApiController extends Controller
{
    public function updatePriority(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $data = $request->validate(['priority' => 'required|in:urgent,high,normal,low']);
        $conversation = DB::transaction(function () use ($conversation, $data) {
            $locked = OmnichannelConversation::query()->lockForUpdate()->findOrFail($conversation->id);
            ConversationAccess::authorize($locked);
            if ($locked->priority !== $data['priority']) {
                $previous = $locked->priority;
                $locked->update($data);
                OmnichannelAuditLog::create(['conversation_id' => $locked->id, 'user_id' => auth('admin')->id(), 'action' => 'priority_changed', 'description' => 'Prioridad actualizada', 'meta_data' => ['previous' => $previous, 'priority' => $locked->priority]]);
            }

            return $locked;
        });
        $this->broadcastSafely(new ConversationUpdated($conversation));

        return response()->json(['success' => true, 'priority' => $conversation->priority]);
    }

    private function broadcastSafely(ConversationUpdated|NewMessageReceived $event): void
    {
        try {
            broadcast($event)->toOthers();
        } catch (\Throwable $error) {
            Log::warning('Omnichannel realtime unavailable; polling will refresh persisted changes', ['event' => get_class($event), 'exception' => get_class($error)]);
        }
    }

    /**
     * Listar conversaciones con filtros de canal, estado y búsqueda.
     */
    public function conversations(Request $request)
    {
        $request->validate(['view' => 'nullable|in:all,mine,unassigned,waiting,unread,priority,bot', 'sort' => 'nullable|in:latest,oldest,priority', 'priority' => 'nullable|in:all,urgent,high,normal,low', 'page' => 'nullable|integer|min:1', 'search' => 'nullable|string|max:150', 'channel' => 'nullable|in:all,whatsapp,messenger,instagram,web', 'status' => 'nullable|in:all,open,closed,waiting,bot_active']);
        $user = auth()->user();
        $isAdmin = $user->roles()->where('nombre', 'admin')->exists();

        $query = OmnichannelConversation::with(['contact.usuario', 'assignedUser'])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('updated_at', 'desc');

        if (! $isAdmin) {
            // Si es un asesor, SOLO ve los chats que están explícitamente asignados a él.
            $query->where('assigned_user_id', $user->id);
        }

        $stats = (clone $query)->withoutEagerLoads()->reorder()->selectRaw("COUNT(*) as total,
            SUM(CASE WHEN status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as open,
            SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) as closed,
            SUM(CASE WHEN status NOT IN ('resolved','closed') AND assigned_user_id = ? THEN 1 ELSE 0 END) as mine,
            SUM(CASE WHEN status NOT IN ('resolved','closed') AND assigned_user_id IS NULL THEN 1 ELSE 0 END) as unassigned,
            SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
            SUM(CASE WHEN status NOT IN ('resolved','closed') AND unread_count > 0 THEN 1 ELSE 0 END) as unread,
            SUM(CASE WHEN status NOT IN ('resolved','closed') AND priority IN ('urgent','high') THEN 1 ELSE 0 END) as priority,
            SUM(CASE WHEN status = 'bot_active' THEN 1 ELSE 0 END) as bot", [$user->id])->first()->getAttributes();
        $stats = array_map(fn ($value) => (int) $value, $stats);
        $channels = (clone $query)->withoutEagerLoads()->reorder()->whereNotIn('status', ['resolved', 'closed'])->select('channel')->selectRaw('COUNT(*) as total')->groupBy('channel')->pluck('total', 'channel');
        match ($request->input('view', 'all')) {
            'mine' => $query->where('assigned_user_id', $user->id),
            'unassigned' => $query->whereNull('assigned_user_id'),
            'waiting' => $query->where('status', 'waiting'),
            'unread' => $query->where('unread_count', '>', 0),
            'priority' => $query->whereIn('priority', ['urgent', 'high']),
            'bot' => $query->where('status', 'bot_active'),
            default => null,
        };
        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }
        if ($request->input('sort') === 'oldest') {
            $query->reorder()->orderBy('last_message_at')->orderBy('id');
        }
        if ($request->input('sort') === 'priority') {
            $query->reorder()->orderByRaw("CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END")->orderByDesc('last_message_at')->orderByDesc('id');
        }

        // Filtro por canal
        if ($request->filled('channel') && $request->channel !== 'all') {
            $query->where('channel', $request->channel);
        }

        // Filtro por estado
        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'open') {
                $query->whereNotIn('status', ['resolved', 'closed']);
            } elseif ($request->status === 'closed') {
                $query->whereIn('status', ['resolved', 'closed']);
            } else {
                $query->where('status', $request->status);
            }
        }

        // Búsqueda por nombre de contacto o teléfono
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('contact', function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('phone_number', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhereHas('usuario', fn ($user) => $user->where('nombres', 'like', '%'.$search.'%')->orWhere('apellidos', 'like', '%'.$search.'%')->orWhere('email', 'like', '%'.$search.'%'));
            });
        }

        $conversations = $query->paginate(50);

        $conversations->getCollection()->transform(function ($conv) {
            // Si el contacto tiene un usuario vinculado, usar su nombre real
            $contactName = $conv->contact->name ?? 'Desconocido';
            if ($conv->contact->usuario) {
                $realName = trim(($conv->contact->usuario->nombres ?? '').' '.($conv->contact->usuario->apellidos ?? ''));
                if ($realName) {
                    $contactName = $realName;
                }
            }

            return [
                'id' => $conv->id,
                'contactName' => $contactName,
                'initials' => strtoupper(mb_substr($contactName, 0, 2)),
                'phone' => $conv->contact->phone_number ?? null,
                'email' => $conv->contact->email ?? $conv->contact->usuario->email ?? null,
                'channel' => $conv->channel,
                'lastMessagePreview' => $conv->last_message_preview,
                'lastMessageTime' => $conv->last_message_at?->format('H:i'),
                'lastMessageDate' => $conv->last_message_at?->format('d/m'),
                'lastMessageAt' => $conv->last_message_at?->toIso8601String(),
                'unreadCount' => $conv->unread_count,
                'priority' => $conv->priority,
                'status' => $conv->status,
                'isBotActive' => $conv->status === 'bot_active',
                'isLinkedUser' => (bool) $conv->contact->usuario_id,
                'assignedUserId' => $conv->assigned_user_id,
                'agentName' => $conv->assignedUser->nombres ?? null,
            ];
        });

        return response()->json(array_merge($conversations->toArray(), ['summary' => $stats, 'channels' => $channels]));
    }

    /**
     * Listar mensajes de una conversación y marcar como leídos.
     */
    public function messages(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $request->validate(['page' => 'nullable|integer|min:1']);
        $user = auth()->user();
        $isAdmin = $user->roles()->where('nombre', 'admin')->exists();

        // Validar que el asesor solo acceda a SUS conversaciones
        if (! $isAdmin && $conversation->assigned_user_id !== $user->id) {
            abort(403, 'No tienes permiso para ver esta conversación.');
        }

        // Marcar como leídos
        if ($conversation->unread_count > 0) {
            $conversation->update(['unread_count' => 0]);
            $this->broadcastSafely(new ConversationUpdated($conversation));
        }

        $messages = $conversation->messages()
            ->orderByDesc('id')->paginate(100);
        $messages->setCollection($messages->getCollection()->reverse()->values());

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
        ConversationAccess::authorize($conversation);
        abort_if(in_array($conversation->status, ['resolved', 'closed'], true), 422, 'Reabre la conversación antes de enviar una respuesta al cliente.');
        $user = auth()->user();
        $isAdmin = $user->roles()->where('nombre', 'admin')->exists();

        // Validar que el asesor solo acceda a SUS conversaciones
        if (! $isAdmin && $conversation->assigned_user_id !== $user->id) {
            abort(403, 'No tienes permiso para enviar mensajes en esta conversación.');
        }

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

        $this->broadcastSafely(new NewMessageReceived($message));
        $this->broadcastSafely(new ConversationUpdated($conversation->refresh()));

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
        ConversationAccess::authorize($conversation, true);
        $request->validate([
            'user_id' => 'required|integer|exists:usuario,id',
        ]);

        ConversationAccess::agent((int) $request->input('user_id'));
        $conversation->update([
            'assigned_user_id' => $request->input('user_id'),
            'status' => 'human_active',
            'is_bot_paused' => true,
            'bot_paused_at' => now(),
            'bot_paused_by' => $request->user()->id,
        ]);

        // Registrar nota interna de asignación
        $agentName = Usuario::find($request->input('user_id'))->nombres ?? 'Agente';

        // Crear ticket
        app(TicketAssignmentService::class)->createCaseForConversation($conversation, $request->input('user_id'));
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

        $this->broadcastSafely(new ConversationUpdated($conversation->load('assignedUser')));

        return response()->json(['success' => true]);
    }

    /**
     * Desasignar agente y devolver al bot.
     */
    public function unassignAgent(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $conversation->update([
            'assigned_user_id' => null,
            'status' => 'bot_active',
            'is_bot_paused' => false,
            'bot_paused_at' => null,
            'bot_paused_by' => null,
        ]);

        $this->broadcastSafely(new ConversationUpdated($conversation));

        return response()->json(['success' => true]);
    }

    /**
     * Marcar conversación como resuelta.
     */
    public function resolveConversation(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $conversation->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $request->user()->id,
        ]);

        $this->broadcastSafely(new ConversationUpdated($conversation));

        return response()->json(['success' => true]);
    }

    /**
     * Reabrir una conversación resuelta.
     */
    public function reopenConversation(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $previousStatus = $conversation->assigned_user_id ? 'human_active' : 'bot_active';

        $conversation->update([
            'status' => $previousStatus,
            'resolved_at' => null,
            'resolved_by' => null,
        ]);

        $this->broadcastSafely(new ConversationUpdated($conversation));

        return response()->json(['success' => true]);
    }

    /**
     * Añadir una nota interna a la conversación.
     */
    public function addInternalNote(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
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

        $this->broadcastSafely(new NewMessageReceived($message));

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
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('shortcut', 'like', '%'.$search.'%')
                    ->orWhere('content', 'like', '%'.$search.'%');
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
        ConversationAccess::authorize($conversation);
        $contact = $conversation->contact;
        $contact->load('usuario');

        // Usar nombre real del usuario vinculado si existe
        $displayName = $contact->name;
        $displayEmail = $contact->email;
        $displayPhone = $contact->phone_number;

        if ($contact->usuario) {
            $realName = trim(($contact->usuario->nombres ?? '').' '.($contact->usuario->apellidos ?? ''));
            if ($realName) {
                $displayName = $realName;
            }
            $displayEmail = $displayEmail ?: $contact->usuario->email;
            $displayPhone = $displayPhone ?: $contact->usuario->telefono;
        }

        // Buscar el último pedido del cliente si tiene un usuario vinculado
        $lastOrder = null;
        if ($contact->usuario_id) {
            $lastOrder = Pedido::where('usuario_id', $contact->usuario_id)
                ->orderBy('created_at', 'desc')
                ->first(['id', 'codigo', 'total', 'estado', 'created_at']);
        }

        // Estadísticas de la conversación
        $stats = [
            'totalConversations' => OmnichannelConversation::where('contact_id', $contact->id)->count(),
            'totalMessages' => OmnichannelMessage::where('contact_id', $contact->id)->count(),
        ];

        // Buscar caso de CRM vinculado a la conversación
        $activeCase = CrmCase::where('omnichannel_conversation_id', $conversation->id)
            ->whereIn('estado', ['abierto', 'en_progreso'])
            ->first(['id', 'titulo', 'estado']);

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
                'metadata' => $contact->metadata,
            ],
            'conversation' => [
                'id' => $conversation->id,
                'subject' => $conversation->subject,
            ],
            'lastOrder' => $lastOrder ? [
                'id' => $lastOrder->id,
                'codigo' => $lastOrder->codigo,
                'total' => $lastOrder->total,
                'estado' => $lastOrder->estado,
                'fecha' => $lastOrder->created_at->format('d/m/Y'),
            ] : null,
            'stats' => $stats,
            'activeCase' => $activeCase,
        ]);
    }

    /**
     * Transferir conversación a bot IA.
     */
    public function transferToBot(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
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

        $this->broadcastSafely(new ConversationUpdated($conversation));

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
        $createdDate = $msg->created_at->copy()->startOfDay();

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
            $result = match ($conversation->getAttribute('channel')) {
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
        if (! $phone) {
            return ['success' => false, 'data' => ['error' => 'Sin número de teléfono']];
        }

        return $whatsapp->sendTextMessage($phone, $content);
    }

    private function sendViaMessenger(OmnichannelConversation $conversation, string $content): array
    {
        $messenger = app(MessengerService::class);
        $recipientId = $conversation->contact->messenger_id ?? null;
        if (! $recipientId) {
            return ['success' => false, 'data' => ['error' => 'Sin ID de Messenger']];
        }

        return $messenger->sendTextMessage($recipientId, $content);
    }

    private function sendViaInstagram(OmnichannelConversation $conversation, string $content): array
    {
        $instagram = app(InstagramService::class);
        $recipientId = $conversation->contact->instagram_id ?? null;
        if (! $recipientId) {
            return ['success' => false, 'data' => ['error' => 'Sin ID de Instagram']];
        }

        return $instagram->sendTextMessage($recipientId, $content);
    }

    // ═══════════════════════════════════════════════════════════════
    // ENTERPRISE ENDPOINTS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Transferir conversación a otro asesor.
     */
    public function transferConversation(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $request->validate([
            'to_user_id' => 'required|integer|exists:usuario,id',
            'reason' => 'nullable|string|max:500',
        ]);

        $fromUser = auth()->user();
        $toUser = ConversationAccess::agent((int) $request->input('to_user_id'));

        app(TicketAssignmentService::class)->transferConversation(
            $conversation, $toUser, $fromUser, $request->input('reason', '')
        );

        OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'user_id' => $fromUser->id,
            'channel' => $conversation->channel,
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => "📋 Transferido de {$fromUser->nombre_completo} a {$toUser->nombre_completo}. Motivo: ".($request->input('reason') ?: 'N/A'),
            'is_internal_note' => true,
            'status' => 'sent',
        ]);

        $this->broadcastSafely(new ConversationUpdated($conversation->refresh()));

        return response()->json(['success' => true]);
    }

    /**
     * Cerrar conversación con motivo.
     */
    public function closeConversation(Request $request, OmnichannelConversation $conversation)
    {
        ConversationAccess::authorize($conversation);
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        app(TicketAssignmentService::class)->closeConversation(
            $conversation, auth()->user(), $request->input('reason')
        );

        $this->broadcastSafely(new ConversationUpdated($conversation->refresh()));

        return response()->json(['success' => true]);
    }

    /**
     * Cambiar estado del asesor actual (online/busy/away/offline).
     */
    public function updateAgentStatus(Request $request)
    {
        $request->validate([
            'status' => 'required|in:online,busy,away,offline',
        ]);

        $config = OmnichannelAgentConfig::firstOrCreate(
            ['usuario_id' => auth()->id()],
            ['max_chats' => 5]
        );

        $config->update(['status' => $request->input('status')]);

        // Si cambió a online, procesar la cola
        if ($request->input('status') === 'online') {
            app(TicketAssignmentService::class)->processQueueForAgent(auth()->user());
        }

        return response()->json(['success' => true, 'status' => $config->status]);
    }

    /**
     * Obtener estado actual del asesor.
     */
    public function getAgentStatus()
    {
        $config = OmnichannelAgentConfig::firstOrCreate(
            ['usuario_id' => auth()->id()],
            ['max_chats' => 5, 'status' => 'offline']
        );

        $activeChats = OmnichannelConversation::where('assigned_user_id', auth()->id())
            ->whereIn('status', ['open', 'human_active', 'waiting', 'bot_active'])
            ->count();

        return response()->json([
            'status' => $config->status,
            'maxChats' => $config->max_chats,
            'activeChats' => $activeChats,
            'skills' => $config->skills ?? [],
        ]);
    }

    /**
     * Dashboard del supervisor: métricas en tiempo real.
     */
    public function supervisorDashboard()
    {
        abort_unless(ConversationAccess::supervisor(auth('admin')->user()), 403);
        // 1. Agentes y su carga
        $agents = Usuario::where('estado', 'activo')->whereHas('roles', function ($q) {
            $q->where('nombre', 'admin')->orWhereHas('permisos', fn ($p) => $p->where('nombre', 'gestionar_omnichannel'));
        })
            ->with('omnichannelConfig')
            ->withCount(['omnichannelConversations as active_chats' => function ($q) {
                $q->whereIn('status', ['open', 'human_active', 'waiting']);
            }])
            ->withCount(['omnichannelConversations as resolved_today' => function ($q) {
                $q->whereIn('status', ['resolved', 'closed'])
                    ->whereDate('closed_at', today());
            }])
            ->get()
            ->map(function ($agent) {
                return [
                    'id' => $agent->id,
                    'name' => $agent->nombre_completo,
                    'status' => $agent->omnichannelConfig->status ?? 'offline',
                    'maxChats' => $agent->omnichannelConfig->max_chats ?? 5,
                    'activeChats' => $agent->getAttribute('active_chats'),
                    'resolvedToday' => $agent->getAttribute('resolved_today'),
                    'skills' => $agent->omnichannelConfig->skills ?? [],
                ];
            });

        // 2. Cola de espera
        $queueCount = OmnichannelQueue::count();
        $queueItems = OmnichannelQueue::with('conversation.contact')
            ->orderBy('queued_at', 'asc')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'conversationId' => $item->conversation_id,
                    'contactName' => $item->conversation->contact->name ?? 'Desconocido',
                    'channel' => $item->conversation?->channel,
                    'priority' => $item->priority,
                    'waitingTime' => $item->queued_at->diffForHumans(),
                    'waitingMinutes' => max(0, $item->queued_at->diffInMinutes(now())),
                ];
            });

        // 3. Métricas globales
        $activeConversations = OmnichannelConversation::whereIn('status', ['open', 'human_active', 'waiting'])->count();
        $botConversations = OmnichannelConversation::where('status', 'bot_active')->count();
        $closedToday = OmnichannelConversation::whereIn('status', ['resolved', 'closed'])
            ->whereDate('closed_at', today())
            ->count();

        return response()->json([
            'agents' => $agents,
            'queue' => [
                'count' => $queueCount,
                'items' => $queueItems,
            ],
            'metrics' => [
                'activeConversations' => $activeConversations,
                'botConversations' => $botConversations,
                'closedToday' => $closedToday,
                'queueCount' => $queueCount,
            ],
        ]);
    }

    /**
     * Listar asesores disponibles para transferencia.
     */
    public function availableAgents()
    {
        $agents = Usuario::where('estado', 'activo')->whereHas('roles', function ($q) {
            $q->where('nombre', 'admin')->orWhereHas('permisos', fn ($p) => $p->where('nombre', 'gestionar_omnichannel'));
        })
            ->with('omnichannelConfig')
            ->withCount(['omnichannelConversations as active_chats' => function ($q) {
                $q->whereIn('status', ['open', 'human_active', 'waiting']);
            }])
            ->get()
            ->map(function ($agent) {
                return [
                    'id' => $agent->id,
                    'name' => $agent->nombre_completo,
                    'status' => $agent->omnichannelConfig->status ?? 'offline',
                    'activeChats' => $agent->getAttribute('active_chats'),
                    'maxChats' => $agent->omnichannelConfig->max_chats ?? 5,
                ];
            });

        return response()->json($agents);
    }
}
