<?php

namespace App\Events\Staff;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Support\Facades\DB;

class CallUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    public string $connection = 'database';

    public string $queue = 'team-realtime';

    public function __construct(public string $callId, public ?int $target = null) {}

    public function broadcastOn(): array
    {
        $ids = $this->target ? collect([$this->target]) : DB::table('staff_call_participants')->where('call_id', $this->callId)->pluck('user_id');

        return $ids->map(fn ($id) => new PrivateChannel('novape-team.user.'.$id))->all();
    }

    public function broadcastAs(): string
    {
        return 'team.call';
    }
}
