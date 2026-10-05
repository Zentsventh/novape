<?php

namespace App\Events\Staff;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\DB;

class ThreadUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    public function __construct(public int $threadId) {}

    public function broadcastOn(): array
    {
        return DB::table('staff_thread_members')->where('thread_id', $this->threadId)->pluck('user_id')
            ->map(fn ($id) => new PrivateChannel('novape-team.user.'.$id))->all();
    }

    public function broadcastAs(): string
    {
        return 'team.updated';
    }
}
