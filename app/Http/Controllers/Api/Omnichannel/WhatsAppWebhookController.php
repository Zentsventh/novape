<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Omnichannel;

use App\Http\Controllers\Controller;
use App\Models\Omnichannel\OmnichannelChannel;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Omnichannel\ChatbotConfig;
use App\Services\Omnichannel\WhatsAppMediaService;
use App\Services\Omnichannel\WhatsAppService;
use App\Events\Omnichannel\NewMessageReceived;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\MessageStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    protected WhatsAppService $whatsapp;
    protected WhatsAppMediaService $mediaService;

    public function __construct(WhatsAppService $whatsapp, WhatsAppMediaService $mediaService)
    {
        $this->whatsapp = $whatsapp;
        $this->mediaService = $mediaService;
    }

    /**
     * Verificación del Webhook (GET) — Meta envía esto al configurar el webhook.
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        if ($mode && $token) {
            if ($mode === 'subscribe' && $token === config('omnichannel.whatsapp.verify_token')) {
                Log::info('OMNICHANNEL_WHATSAPP_WEBHOOK_VERIFIED');
                return response($challenge, 200)->header('Content-Type', 'text/plain');
            }
            return response('Forbidden', 403);
        }
        return response('Bad Request', 400);
    }

    /**
     * Recepción de mensajes y eventos (POST).
     */
    public function handle(Request $request)
    {
        $body = $request->all();
        Log::debug('OMNICHANNEL_WHATSAPP_WEBHOOK', ['body' => $body]);

        if (!isset($body['object']) || $body['object'] !== 'whatsapp_business_account') {
            return response('Not Found', 404);
        }

        foreach ($body['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $value = $change['value'] ?? [];
                if (($change['field'] ?? '') !== 'messages') continue;

                $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;

                if (isset($value['messages'])) {
                    foreach ($value['messages'] as $message) {
                        $this->processIncomingMessage($message, $value, $phoneNumberId);
                    }
                }

                if (isset($value['statuses'])) {
                    foreach ($value['statuses'] as $status) {
                        $this->processStatusUpdate($status);
                    }
                }
            }
        }

        return response('EVENT_RECEIVED', 200);
    }

    protected function processIncomingMessage(array $message, array $value, ?string $phoneNumberId): void
    {
        $from = $message['from'] ?? null;
        $messageId = $message['id'] ?? null;
        $type = $message['type'] ?? 'unknown';
        $contactName = $value['contacts'][0]['profile']['name'] ?? 'Sin nombre';
        $content = $this->extractContent($message, $type);

        if ($messageId) {
            $this->whatsapp->markAsRead($messageId);
        }

        // Descargar media
        $mediaUrl = null;
        $mediaMimeType = null;
        $mediaFileSize = null;

        if (in_array($type, ['image', 'audio', 'document', 'video', 'sticker'])) {
            $mediaObject = $message[$type] ?? [];
            $mediaId = $mediaObject['id'] ?? null;
            $mediaMimeType = $mediaObject['mime_type'] ?? null;
            $mediaFileSize = $mediaObject['file_size'] ?? null;

            if ($mediaId) {
                $accessToken = config('omnichannel.whatsapp.token');
                $mediaUrl = $this->mediaService->downloadAndStoreMedia($mediaId, $accessToken, $mediaMimeType ?? 'application/octet-stream');
            }
        }

        // Buscar o crear contacto
        $contact = OmnichannelContact::firstOrCreate(
            ['phone_number' => $from],
            ['name' => $contactName, 'first_interaction_at' => now()]
        );
        $contact->update(['last_interaction_at' => now()]);

        // Buscar o crear conversación
        $conversation = OmnichannelConversation::firstOrCreate(
            ['contact_id' => $contact->id, 'channel' => 'whatsapp'],
            ['status' => 'bot_active', 'priority' => 'normal', 'message_count' => 0, 'unread_count' => 0]
        );

        // Guardar mensaje
        $inboundMessage = OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $contact->id,
            'channel' => 'whatsapp',
            'direction' => 'inbound',
            'message_type' => $type,
            'content' => $content,
            'media_url' => $mediaUrl,
            'media_mime_type' => $mediaMimeType,
            'media_file_size' => $mediaFileSize,
            'external_message_id' => $messageId,
            'status' => 'delivered',
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'last_message_preview' => substr($content ?? '', 0, 50),
            'unread_count' => DB::raw('unread_count + 1'),
            'message_count' => DB::raw('message_count + 1'),
        ]);
        $conversation->refresh();

        // Broadcast en tiempo real al panel
        broadcast(new NewMessageReceived($inboundMessage))->toOthers();
        broadcast(new ConversationUpdated($conversation))->toOthers();

        // Respuesta automática del bot
        if ($conversation->status === 'bot_active' && $from && $type === 'text') {
            $settings = ChatbotConfig::first();
            if ($settings && $settings->is_bot_active) {
                \App\Jobs\Omnichannel\ProcessWhatsAppMessageJob::dispatch($inboundMessage->id);
            }
        }
    }

    protected function extractContent(array $message, string $type): ?string
    {
        return match ($type) {
            'text' => $message['text']['body'] ?? null,
            'image' => $message['image']['caption'] ?? '[Imagen]',
            'video' => $message['video']['caption'] ?? '[Video]',
            'audio' => '[Audio]',
            'document' => $message['document']['filename'] ?? '[Documento]',
            'sticker' => '[Sticker]',
            'location' => sprintf('[Ubicación: %s, %s]', $message['location']['latitude'] ?? '?', $message['location']['longitude'] ?? '?'),
            'contacts' => '[Contacto compartido]',
            'reaction' => $message['reaction']['emoji'] ?? '[Reacción]',
            'interactive' => $message['interactive']['button_reply']['title'] ?? $message['interactive']['list_reply']['title'] ?? '[Interactivo]',
            'button' => $message['button']['text'] ?? '[Botón]',
            default => "[Tipo no soportado: {$type}]",
        };
    }

    protected function processStatusUpdate(array $status): void
    {
        $messageId = $status['id'] ?? null;
        $statusValue = $status['status'] ?? null;

        if ($messageId) {
            $msg = OmnichannelMessage::where('external_message_id', $messageId)->first();
            if ($msg) {
                $msg->update(['status' => $statusValue]);
                broadcast(new MessageStatusUpdated($msg))->toOthers();
            }
        }

        if ($statusValue === 'failed') {
            Log::error('OMNICHANNEL_WA_MESSAGE_FAILED', ['message_id' => $messageId, 'errors' => $status['errors'] ?? []]);
        }
    }
}
