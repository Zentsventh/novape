<?php

declare(strict_types=1);

namespace App\Jobs\Omnichannel;

use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\MessageStatusUpdated;
use App\Events\Omnichannel\NewMessageReceived;
use App\Models\ConfiguracionSitio;
use App\Models\CrmDeal;
use App\Models\CrmPipeline;
use App\Models\Omnichannel\ChatbotConfig;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Models\Usuario;
use App\Services\Omnichannel\WhatsAppMediaService;
use App\Services\Omnichannel\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProcessIncomingWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $change;

    public function __construct(array $change)
    {
        $this->change = $change;
    }

    public function handle(WhatsAppService $whatsapp, WhatsAppMediaService $mediaService): void
    {
        if (($this->change['field'] ?? '') !== 'messages') {
            return;
        }

        $value = $this->change['value'] ?? [];
        $phoneNumberId = $value['metadata']['phone_number_id'] ?? null;

        if (isset($value['messages'])) {
            foreach ($value['messages'] as $message) {
                $this->processIncomingMessage($message, $value, $phoneNumberId, $whatsapp, $mediaService);
            }
        }

        if (isset($value['statuses'])) {
            foreach ($value['statuses'] as $status) {
                $this->processStatusUpdate($status);
            }
        }
    }

    protected function processIncomingMessage(array $message, array $value, ?string $phoneNumberId, WhatsAppService $whatsapp, WhatsAppMediaService $mediaService): void
    {
        $from = $message['from'] ?? null;
        $messageId = $message['id'] ?? null;
        if (! is_string($from) || ! preg_match('/^\d{6,20}$/', $from) || ! is_string($messageId) || $messageId === '') {
            Log::warning('WhatsApp message rejected: missing valid sender or identifier.');

            return;
        }
        DB::table('omnichannel_contact_locks')->insertOrIgnore(['phone_number' => $from]);
        DB::transaction(function () use ($from, $messageId, $message, $value, $phoneNumberId, $whatsapp, $mediaService) {
            DB::table('omnichannel_contact_locks')->where('phone_number', $from)->lockForUpdate()->first();
            if (OmnichannelMessage::where('channel', 'whatsapp')->where('direction', 'inbound')->where('external_message_id', $messageId)->exists()) {
                return;
            }
            $this->persistIncomingMessage($message, $value, $phoneNumberId, $whatsapp, $mediaService);
        });
    }

    protected function persistIncomingMessage(array $message, array $value, ?string $phoneNumberId, WhatsAppService $whatsapp, WhatsAppMediaService $mediaService): void
    {
        $from = $message['from'] ?? null;
        $messageId = $message['id'] ?? null;
        $type = $message['type'] ?? 'unknown';
        $contactName = $value['contacts'][0]['profile']['name'] ?? 'Sin nombre';
        $content = $this->extractContent($message, $type);

        if ($messageId) {
            $whatsapp->markAsRead($messageId);
        }

        // Descargar media asíncronamente
        $mediaUrl = null;
        $mediaMimeType = null;
        $mediaFileSize = null;

        if (in_array($type, ['image', 'audio', 'document', 'video', 'sticker'])) {
            $mediaObject = $message[$type] ?? [];
            $mediaId = $mediaObject['id'] ?? null;
            $mediaMimeType = $mediaObject['mime_type'] ?? null;
            $mediaFileSize = $mediaObject['file_size'] ?? null;

            if ($mediaId) {
                $accessToken = ConfiguracionSitio::obtener('whatsapp_token', config('omnichannel.whatsapp.token'));
                $mediaUrl = $mediaService->downloadAndStoreMedia($mediaId, $accessToken, $mediaMimeType ?? 'application/octet-stream');
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

        if ($conversation->wasRecentlyCreated) {
            // Crear Deal automáticamente en CRM
            $pipeline = CrmPipeline::with('stages')->where('is_default', true)->first();
            if (! $pipeline) {
                $pipeline = CrmPipeline::with('stages')->first();
            }

            if ($pipeline && $pipeline->stages->count() > 0) {
                // Buscar si ya existe usuario con este número, si no, crear lead
                $usuario = Usuario::where('telefono', $from)->first();

                if (! $usuario) {
                    $usuario = Usuario::create([
                        'nombres' => $contactName,
                        'apellidos' => '(WhatsApp)',
                        'email' => 'wa_'.$from.'@novape.com', // Placeholder obligatorio
                        'telefono' => $from,
                        'password_hash' => bcrypt(Str::random(16)),
                        'has_set_password' => false,
                    ]);
                }

                CrmDeal::create([
                    'usuario_id' => $usuario->id,
                    'stage_id' => $pipeline->stages->first()->id,
                    'titulo' => 'Lead de WhatsApp: '.$contactName,
                    'valor' => 0,
                    'omnichannel_conversation_id' => $conversation->id,
                ]);
            }
        }

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
            'last_message_preview' => mb_substr($content ?? '', 0, 50),
            'unread_count' => DB::raw('unread_count + 1'),
            'message_count' => DB::raw('message_count + 1'),
        ]);
        $conversation->refresh();

        // Broadcast en tiempo real al panel
        DB::afterCommit(function () use ($inboundMessage, $conversation) {
            broadcast(new NewMessageReceived($inboundMessage))->toOthers();
            broadcast(new ConversationUpdated($conversation))->toOthers();
        });

        // Respuesta automática del bot
        if ($conversation->status === 'bot_active' && $from && $type === 'text') {
            $settings = ChatbotConfig::first();
            if ($settings && $settings->is_bot_active) {
                ProcessWhatsAppMessageJob::dispatch($inboundMessage->id)->afterCommit();
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
        $newStatus = $status['status'] ?? null; // 'sent', 'delivered', 'read', 'failed'

        if (! $messageId || ! $newStatus) {
            return;
        }

        $msg = OmnichannelMessage::where('external_message_id', $messageId)->first();
        if ($msg) {
            $msg->update(['status' => $newStatus]);
            broadcast(new MessageStatusUpdated($msg))->toOthers();
        }
    }
}
