<?php

namespace App\Jobs\Omnichannel;

use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Omnichannel\OmnichannelMessage;
use App\Services\Chatbot\ChatbotService;
use App\Events\Omnichannel\ConversationUpdated;
use App\Events\Omnichannel\NewMessageReceived;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessWebChatbotMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120; // Allow 2 minutes for Gemini

    public function __construct(
        public int $conversationId,
        public int $contactId,
        public array $messagesHistory
    ) {}

    public function handle(ChatbotService $chatbotService): void
    {
        $conversation = OmnichannelConversation::find($this->conversationId);
        
        if (!$conversation || $conversation->is_bot_paused) {
            return; // If bot was paused in the meantime, abort.
        }

        try {
            DB::beginTransaction();

            $reply = $chatbotService->getReply($this->messagesHistory);

            if ($reply) {
                $outboundMessage = OmnichannelMessage::create([
                    'conversation_id' => $this->conversationId,
                    'contact_id'      => $this->contactId,
                    'channel'         => 'web',
                    'direction'       => 'outbound',
                    'message_type'    => 'text',
                    'content'         => $reply,
                    'status'          => 'sent',
                    'is_ai_generated' => true,
                ]);

                $conversation->update([
                    'last_message_preview' => mb_substr($reply, 0, 50),
                    'last_message_at'      => now(),
                    'message_count'        => DB::raw('message_count + 1'),
                ]);

                DB::commit();

                // Transmitir al frontend
                broadcast(new NewMessageReceived($outboundMessage))->toOthers();
                broadcast(new ConversationUpdated($conversation->refresh()))->toOthers();
            } else {
                DB::rollBack();
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en ProcessWebChatbotMessageJob: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
        }
    }
}
