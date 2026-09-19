<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Omnichannel;

use App\Http\Controllers\Controller;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Omnichannel\CannedResponse;
use App\Services\Omnichannel\WhatsAppService;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\NewMessageReceived;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConversationApiController extends Controller
{
    public function conversations(Request $request)
    {
        $query = OmnichannelConversation::with(['contact', 'assignedUser'])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('updated_at', 'desc');

        // Filtro por canal
        if ($request->has('channel') && $request->channel !== 'all') {
            $query->where('channel', $request->channel);
        }

        // Filtro por estado
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Búsqueda por nombre de contacto
        if ($request->has('search') && $request->search) {
            $query->whereHas('contact', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('phone_number', 'like', '%' . $request->search . '%');
            });
        }

        $conversations = $query->paginate(50);

        $conversations->getCollection()->transform(function ($conv) {
            return [
                'id' => $conv->id,
                'contactName' => $conv->contact->name ?? 'Desconocido',
                'initials' => strtoupper(mb_substr($conv->contact->name ?? '??', 0, 2)),
                'phone' => $conv->contact->phone_number ?? null,
                'channel' => $conv->channel,
                'lastMessagePreview' => $conv->last_message_preview,
                'lastMessageTime' => $conv->last_message_at?->format('H:i'),
                'lastMessageDate' => $conv->last_message_at?->format('d/m'),
                'unreadCount' => $conv->unread_count,
                'priority' => $conv->priority,
                'status' => $conv->status,
                'isBotActive' => $conv->status === 'bot_active',
                'assignedUserId' => $conv->assigned_user_id,
                'agentName' => $conv->assignedUser?->nombres ?? null,
            ];
        });

        return response()->json($conversations);
    }

    public function messages(Request $request, OmnichannelConversation $conversation)
    {
        // Marcar como leídos
        $conversation->update(['unread_count' => 0]);
        broadcast(new ConversationUpdated($conversation))->toOthers();

        $messages = $conversation->messages()
            ->orderBy('created_at', 'asc')
            ->paginate(100);

        $messages->getCollection()->transform(function ($msg) {
            return [
                'id' => $msg->id,
                'direction' => $msg->direction,
                'messageType' => $msg->message_type,
                'content' => $msg->content,
                'mediaUrl' => $msg->media_url,
                'mediaMimeType' => $msg->media_mime_type,
                'time' => $msg->created_at->format('H:i'),
                'status' => $msg->status,
                'isInternalNote' => (bool) $msg->is_internal_note,
                'isAiGenerated' => (bool) $msg->is_ai_generated,
            ];
        });

        return response()->json($messages);
    }

    public function sendMessage(Request $request, OmnichannelConversation $conversation, WhatsAppService $whatsapp)
    {
        $request->validate(['content' => 'required|string|max:4096']);
        $content = $request->input('content');

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

        $conversation->update([
            'last_message_preview' => substr($content, 0, 50),
            'last_message_at' => now(),
            'message_count' => DB::raw('message_count + 1'),
        ]);

        // Enviar por WhatsApp
        if ($conversation->channel === 'whatsapp' && $conversation->contact->phone_number) {
            try {
                $response = $whatsapp->sendTextMessage($conversation->contact->phone_number, $content);
                if (isset($response['data']['messages'][0]['id'])) {
                    $message->update([
                        'external_message_id' => $response['data']['messages'][0]['id'],
                        'status' => 'sent',
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('INBOX_SEND_ERROR', ['msg' => $e->getMessage()]);
                $message->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            }
        }

        broadcast(new NewMessageReceived($message))->toOthers();
        broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'direction' => 'outbound',
                'messageType' => 'text',
                'content' => $message->content,
                'time' => $message->created_at->format('H:i'),
                'status' => $message->status,
                'isInternalNote' => false,
                'isAiGenerated' => false,
            ],
        ]);
    }

    public function assignAgent(Request $request, OmnichannelConversation $conversation)
    {
        $request->validate(['user_id' => 'required|integer']);

        $conversation->update([
            'assigned_user_id' => $request->input('user_id'),
            'status' => 'human_active',
            'is_bot_paused' => true,
            'bot_paused_at' => now(),
            'bot_paused_by' => $request->user()->id,
        ]);

        broadcast(new ConversationUpdated($conversation->load('assignedUser')))->toOthers();
        return response()->json(['success' => true]);
    }

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
            'message' => [
                'id' => $message->id,
                'direction' => 'outbound',
                'messageType' => 'text',
                'content' => $message->content,
                'time' => $message->created_at->format('H:i'),
                'status' => 'sent',
                'isInternalNote' => true,
                'isAiGenerated' => false,
            ],
        ]);
    }

    public function cannedResponses()
    {
        return response()->json(CannedResponse::where('is_active', true)->get());
    }

    public function contactProfile(OmnichannelConversation $conversation)
    {
        $contact = $conversation->contact;
        $contact->load('usuario');

        // Buscar el último pedido del cliente si tiene un usuario vinculado
        $lastOrder = null;
        if ($contact->usuario_id) {
            $lastOrder = \App\Models\Pedido::where('usuario_id', $contact->usuario_id)
                ->orderBy('created_at', 'desc')
                ->first(['id', 'codigo', 'total', 'estado', 'created_at']);
        }

        return response()->json([
            'contact' => [
                'id' => $contact->id,
                'name' => $contact->name,
                'phone' => $contact->phone_number,
                'email' => $contact->email,
                'profilePicture' => $contact->profile_picture_url,
                'notes' => $contact->notes,
                'isBlocked' => $contact->is_blocked,
                'firstInteraction' => $contact->first_interaction_at?->format('d/m/Y'),
                'lastInteraction' => $contact->last_interaction_at?->format('d/m/Y H:i'),
                'linkedUserId' => $contact->usuario_id,
            ],
            'lastOrder' => $lastOrder ? [
                'id' => $lastOrder->id,
                'codigo' => $lastOrder->codigo,
                'total' => $lastOrder->total,
                'estado' => $lastOrder->estado,
                'fecha' => $lastOrder->created_at->format('d/m/Y'),
            ] : null,
        ]);
    }
}
