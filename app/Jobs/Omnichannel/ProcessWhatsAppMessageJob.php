<?php

declare(strict_types=1);

namespace App\Jobs\Omnichannel;

use App\Models\Omnichannel\ChatbotConfig;
use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Services\Omnichannel\GeminiChatService;
use App\Services\Omnichannel\WhatsAppService;
use App\Events\Omnichannel\NewMessageReceived;
use App\Events\Omnichannel\ConversationUpdated;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessWhatsAppMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public function __construct(
        protected int $messageId
    ) {}

    public function handle(GeminiChatService $gemini, WhatsAppService $whatsapp): void
    {
        $inboundMessage = OmnichannelMessage::with('conversation.contact')->find($this->messageId);
        if (!$inboundMessage) return;

        $conversation = $inboundMessage->conversation;
        if (!$conversation || $conversation->status !== 'bot_active') return;

        $settings = ChatbotConfig::first();
        if (!$settings || !$settings->is_bot_active) return;

        // Construir historial de contexto
        $history = OmnichannelMessage::where('conversation_id', $conversation->id)
            ->where('is_internal_note', false)
            ->orderBy('created_at', 'desc')
            ->limit($settings->max_context_messages)
            ->get()
            ->reverse()
            ->map(fn($msg) => [
                'is_ai' => $msg->direction === 'outbound',
                'content' => $msg->content ?? '[Media]',
            ])
            ->values()
            ->toArray();

        // Construir system prompt
        $systemPrompt = $settings->system_prompt ?? "Eres el asistente virtual de Novape. Responde de forma amable y profesional en español.";

        if ($settings->custom_instructions) {
            $systemPrompt .= "\n\n" . $settings->custom_instructions;
        }

        // Llamar a Gemini
        $response = $gemini->generateResponse(
            $systemPrompt,
            $history,
            $inboundMessage->content ?? '',
            $settings->ai_temperature ?? 0.7
        );

        // Procesar la respuesta
        if (is_string($response)) {
            // Error string
            $this->sendBotReply($conversation, $inboundMessage, $response, $whatsapp, 0, 0);
            return;
        }

        if ($response['type'] === 'functionCall') {
            // Transferir a humano
            $reason = $response['data']['args']['reason'] ?? 'Solicitud del cliente';
            $conversation->update([
                'status' => 'waiting',
                'is_bot_paused' => true,
                'bot_paused_at' => now(),
            ]);

            $transferMessage = "🔄 Tu conversación ha sido transferida a un agente humano. Motivo: {$reason}. Un momento por favor.";
            $this->sendBotReply($conversation, $inboundMessage, $transferMessage, $whatsapp, $response['tokens'] ?? 0, (int) ($response['duration_ms'] ?? 0));

            broadcast(new ConversationUpdated($conversation))->toOthers();
            return;
        }

        // Respuesta de texto normal
        $botText = $response['data'] ?? 'Lo siento, no pude procesar tu mensaje.';
        $this->sendBotReply($conversation, $inboundMessage, $botText, $whatsapp, $response['tokens'] ?? 0, (int) ($response['duration_ms'] ?? 0));
    }

    private function sendBotReply(
        OmnichannelConversation $conversation,
        OmnichannelMessage $inboundMessage,
        string $text,
        WhatsAppService $whatsapp,
        int $tokens,
        int $durationMs
    ): void {
        // 1. Guardar en BD
        $botMessage = OmnichannelMessage::create([
            'conversation_id' => $conversation->id,
            'contact_id' => $conversation->contact_id,
            'channel' => 'whatsapp',
            'direction' => 'outbound',
            'message_type' => 'text',
            'content' => $text,
            'is_ai_generated' => true,
            'ai_engine_used' => 'gemini',
            'ai_tokens_used' => $tokens,
            'ai_response_time_ms' => $durationMs,
            'status' => 'queued',
        ]);

        // 2. Enviar por WhatsApp
        $phoneNumber = $conversation->contact->phone_number ?? null;
        if ($phoneNumber) {
            try {
                $result = $whatsapp->sendTextMessage($phoneNumber, $text);
                if (isset($result['data']['messages'][0]['id'])) {
                    $botMessage->update([
                        'external_message_id' => $result['data']['messages'][0]['id'],
                        'status' => 'sent',
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('BOT_REPLY_SEND_ERROR', ['error' => $e->getMessage()]);
                $botMessage->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
            }
        }

        // 3. Actualizar conversación
        $conversation->update([
            'last_message_preview' => substr($text, 0, 50),
            'last_message_at' => now(),
            'message_count' => DB::raw('message_count + 1'),
        ]);

        // 4. Broadcast al panel
        broadcast(new NewMessageReceived($botMessage))->toOthers();
        broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();
    }
}
