<?php

namespace App\Events\Omnichannel;

use App\Models\Omnichannel\OmnichannelConversation;
use App\Services\Omnichannel\ConversationAccess;
use Illuminate\Broadcasting\InteractsWithSockets;
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
            'initials' => $this->computeInitials($conversation->contact->name ?? 'XX'),
            'phone' => $conversation->contact->phone_number ?? null,
            'channel' => $conversation->channel,
            'lastMessagePreview' => $conversation->last_message_preview,
            'lastMessageTime' => $conversation->last_message_at?->format('H:i'),
            'unreadCount' => $conversation->unread_count,
            'priority' => $conversation->priority,
            'isBotActive' => $conversation->status === 'bot_active',
            'status' => $conversation->status,
            'assignedUserId' => $conversation->assigned_user_id,
            'agentName' => $conversation->assignedUser->nombres ?? null,
        ];
    }

    private function computeInitials(string $name): string
    {
        $words = explode(' ', trim($name));
        if (count($words) >= 2) {
            return strtoupper(mb_substr($words[0], 0, 1).mb_substr($words[1], 0, 1));
        }

        return strtoupper(mb_substr($name, 0, 2));
    }

    public function broadcastOn(): array
    {
        return ConversationAccess::channels((int) $this->conversationData['id']);
    }

    public function broadcastAs(): string
    {
        return 'conversation.updated';
    }
}
