<?php

namespace App\Services\Team;

use App\Events\Staff\CallUpdated;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

final class TeamCalls
{
    public function access(string $id): object
    {
        $user = TeamAccess::user();
        $call = DB::table('staff_calls')->find($id);
        abort_unless(is_object($call), 404);
        TeamAccess::thread($call->thread_id);
        abort_unless(DB::table('staff_call_participants')->where('call_id', $id)->where('user_id', $user->id)->exists(), 403);

        return $call;
    }

    public function expire(?string $id = null): void
    {
        $query = DB::table('staff_calls')->whereIn('status', ['ringing', 'active']);
        if ($id) {
            $query->where('id', $id);
        }
        foreach ($query->pluck('id') as $callId) {
            DB::transaction(function () use ($callId) {
                $call = DB::table('staff_calls')->where('id', $callId)->lockForUpdate()->first();
                if (! $call || ! in_array($call->status, ['ringing', 'active'])) {
                    return;
                }
                $stale = DB::table('staff_call_participants')->where('call_id', $callId)->where('state', 'joined')->where('last_seen_at', '<', now()->subSeconds(config('team.heartbeat_seconds')))->update(['state' => 'left', 'left_at' => now(), 'client_id' => null]);
                $joined = DB::table('staff_call_participants')->where('call_id', $callId)->where('state', 'joined')->count();
                $invited = DB::table('staff_call_participants')->where('call_id', $callId)->where('state', 'invited')->count();
                if (! $joined || ($call->status === 'ringing' && (! $invited || now()->greaterThan($call->expires_at)))) {
                    $this->finish($callId, $call->status === 'ringing' ? ($invited ? 'missed' : 'declined') : 'ended');
                } elseif ($stale) {
                    $this->notify($callId);
                }
            });
        }
    }

    public function finish(string $id, string $reason): void
    {
        DB::transaction(function () use ($id, $reason) {
            $call = DB::table('staff_calls')->where('id', $id)->lockForUpdate()->first();
            if (! $call || $call->status === 'ended') return;
            DB::table('staff_calls')->where('id', $id)->update(['status' => 'ended', 'end_reason' => $reason, 'ended_at' => now(), 'updated_at' => now()]);
            DB::table('staff_call_participants')->where('call_id', $id)->whereIn('state', ['joined', 'invited'])->update(['state' => 'left', 'left_at' => now(), 'client_id' => null]);
            TeamAccess::log($call->thread_id, 'call_ended', ['call_id' => $id, 'reason' => $reason, 'automatic' => ! auth('admin')->check()], auth('admin')->id() ?? $call->created_by);
            $this->notify($id);
            TeamAccess::notify($call->thread_id);
        });
    }

    public function notify(string $id, ?int $target = null): void
    {
        try {
            event(new CallUpdated($id, $target));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Team call notification unavailable; polling remains active', ['call_id' => $id, 'exception' => get_class($e)]);
        }
    }

    public function data(object $call, $participants = null): array
    {
        $user = TeamAccess::user();
        foreach (['scheduled_at', 'started_at', 'ended_at', 'expires_at'] as $field) {
            if ($call->$field) {
                $call->$field = Carbon::parse($call->$field, config('app.timezone'))->toIso8601String();
            }
        }
        $participants ??= DB::table('staff_call_participants as p')->join('usuario as u', 'u.id', '=', 'p.user_id')->where('call_id', $call->id)->get(['p.*', 'u.nombres', 'u.apellidos']);

        return ['id' => $call->id, 'thread_id' => $call->thread_id, 'created_by' => $call->created_by, 'title' => $call->title, 'kind' => $call->kind, 'status' => $call->status, 'end_reason' => $call->end_reason,
            'scheduled_at' => $call->scheduled_at, 'started_at' => $call->started_at, 'ended_at' => $call->ended_at, 'expires_at' => $call->expires_at, 'max_participants' => config('team.max_participants'),
            'participants' => $participants->map(fn ($p) => ['user_id' => $p->user_id, 'name' => trim($p->nombres.' '.$p->apellidos), 'state' => $p->state, 'connection_id' => $p->client_id,
                'audio_muted' => (bool) $p->audio_muted, 'video_enabled' => (bool) $p->video_enabled, 'screen_sharing' => (bool) $p->screen_sharing, 'hand_raised' => (bool) $p->hand_raised]),
            'self' => $participants->firstWhere('user_id', $user->id)?->state,
        ];
    }

    public function requireClient(string $id, string $client): object
    {
        $participant = DB::table('staff_call_participants')->where('call_id', $id)->where('user_id', TeamAccess::user()->id)->first();
        abort_unless($participant && $participant->state === 'joined' && $participant->client_id === $client, 409, 'La llamada está abierta en otra pestaña o ya finalizó.');

        return $participant;
    }

    public function checkBusy(int $user, ?string $except = null): void
    {
        $query = DB::table('staff_call_participants as p')->join('staff_calls as c', 'c.id', '=', 'p.call_id')->where('p.user_id', $user)->where('p.state', 'joined')->whereIn('c.status', ['ringing', 'active'])->where('p.last_seen_at', '>', now()->subSeconds(config('team.heartbeat_seconds')));
        if ($except) {
            $query->where('c.id', '!=', $except);
        }
        abort_if($query->exists(), 409, 'Ya tienes otra llamada activa.');
    }
}
