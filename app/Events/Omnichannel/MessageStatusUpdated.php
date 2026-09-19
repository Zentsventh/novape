<?php

namespace App\Events\Omnichannel;

use App\Models\Omnichannel\OmnichannelMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $statusData;

    public function __construct(OmnichannelMessage $message)
    {
        $this->statusData = [
            'id' => $message->id,
            'conversation_id' => $message->conversation_id,
            'status' => $message->status,
        ];
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('novape-inbox')];
    }

    public function broadcastAs(): string
    {
        return 'message.status.updated';
    }
}
