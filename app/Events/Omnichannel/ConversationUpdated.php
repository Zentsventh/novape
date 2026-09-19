<?php

namespace App\Events\Omnichannel;

use App\Models\Omnichannel\OmnichannelConversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $conversationData;

    public function __construct(OmnichannelConversation $conversation)
    {
        $conversation->load('contact', 'assignedUser');

        $this->conversationData = [
            'id' => $conversation->id,
            'contactName' => $conversation->contact->name ?? 'Desconocido',
            'phone' => $conversation->contact->phone_number ?? null,
            'channel' => $conversation->channel,
            'lastMessagePreview' => $conversation->last_message_preview,
            'lastMessageTime' => $conversation->last_message_at?->format('H:i'),
            'unreadCount' => $conversation->unread_count,
            'priority' => $conversation->priority,
            'isBotActive' => $conversation->status === 'bot_active',
            'status' => $conversation->status,
            'assignedUserId' => $conversation->assigned_user_id,
            'agentName' => $conversation->assignedUser?->nombres ?? null,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('novape-inbox')];
    }

    public function broadcastAs(): string
    {
        return 'conversation.updated';
    }
}
