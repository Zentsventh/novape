<?php

namespace App\Events\Omnichannel;

use App\Models\Omnichannel\OmnichannelMessage;
use App\Services\Omnichannel\ConversationAccess;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessageReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $messageData;

    public function __construct(OmnichannelMessage $message)
    {
        $this->messageData = [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'direction' => $message->direction,
            'messageType' => $message->message_type,
            'content' => $message->content,
            'mediaUrl' => $message->media_url,
            'mediaMimeType' => $message->media_mime_type,
            'time' => $message->created_at->format('H:i'),
            'status' => $message->status,
            'isInternalNote' => (bool) $message->is_internal_note,
            'isAiGenerated' => (bool) $message->is_ai_generated,
            'contactName' => $message->contact->name ?? 'Desconocido',
            'channel' => $message->channel,
        ];
    }

    public function broadcastOn(): array
    {
        return ConversationAccess::channels((int) $this->messageData['conversation_id']);
    }

    public function broadcastAs(): string
    {
        return 'message.received';
    }
}
