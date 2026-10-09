<?php

namespace App\Events\Staff;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\DB;

class ThreadUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    public string $connection = 'database';
    public string $queue = 'team-realtime';
    public function __construct(public int $threadId, public array $recipients = []) {}

    public function broadcastOn(): array
    {
        $channels = DB::table('staff_thread_members')->where('thread_id', $this->threadId)->pluck('user_id')->merge($this->recipients)->unique()
            ->map(fn ($id) => new PrivateChannel('novape-team.user.'.$id))->all();
        $channels[] = new PrivateChannel('staff-thread.'.$this->threadId);
        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'team.updated';
    }
}
