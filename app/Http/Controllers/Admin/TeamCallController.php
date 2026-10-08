<?php

namespace App\Http\Controllers\Admin;

use App\Events\Staff\ThreadUpdated;
use App\Http\Controllers\Controller;
use App\Services\Team\TeamAccess;
use App\Services\Team\TeamCalls;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TeamCallController extends Controller
{
    public function __construct(private TeamCalls $calls) {}

    public function config()
    {
        $user = TeamAccess::user();
        $servers = config('team.ice_servers');
        if (config('team.turn_secret')) {
            foreach ($servers as &$server) {
                if (str_contains(json_encode($server['urls']), 'turn:') || str_contains(json_encode($server['urls']), 'turns:')) {
                    $server['username'] = now()->addHours(12)->timestamp.':'.$user->id;
                    $server['credential'] = base64_encode(hash_hmac('sha1', $server['username'], config('team.turn_secret'), true));
                }
            }
            unset($server);
        }

        return response()->json(['ice_servers' => $servers, 'max_participants' => config('team.max_participants'), 'has_turn' => (bool) collect($servers)->contains(fn ($s) => str_contains(json_encode($s['urls']), 'turn:') || str_contains(json_encode($s['urls']), 'turns:'))]);
    }

    public function create(Request $request, int $thread)
    {
        $threadRow = TeamAccess::thread($thread);
        $data = $request->validate(['request_id' => 'required|uuid', 'client_id' => 'required|uuid', 'kind' => 'required|in:audio,video', 'title' => 'nullable|string|max:120', 'scheduled_at' => 'nullable|date|after:now']);
        $this->calls->expire();
        $user = TeamAccess::user();
        TeamAccess::profile($user->id);
        $id = DB::transaction(function () use ($thread, $threadRow, $data, $user) {
            DB::table('staff_threads')->where('id', $thread)->lockForUpdate()->first();
            $existing = DB::table('staff_calls')->where('thread_id', $thread)->where('request_id', $data['request_id'])->first();
            if ($existing) {
                $scheduled = empty($data['scheduled_at']) ? null : Carbon::parse($data['scheduled_at'])->setTimezone(config('app.timezone'))->format('Y-m-d H:i:s');
                abort_unless((int) $existing->created_by === $user->id && $existing->kind === $data['kind'] && $existing->title === (trim($data['title'] ?? '') ?: $threadRow->title) && $existing->scheduled_at === $scheduled, 409, 'Este identificador ya corresponde a otra llamada.');

                return $existing->id;
            }
            abort_if(DB::table('staff_messages')->where('thread_id', $thread)->where('request_id', $data['request_id'])->exists(), 409, 'Este identificador ya corresponde a un mensaje.');
            $scheduled = ! empty($data['scheduled_at']);
            if (! $scheduled) {
                DB::table('staff_worker_profiles')->where('user_id', $user->id)->lockForUpdate()->first();
                $this->calls->checkBusy($user->id);
                abort_if(DB::table('staff_calls')->where('thread_id', $thread)->whereIn('status', ['ringing', 'active'])->exists(), 409, 'Este chat ya tiene una llamada. Únete desde su registro.');
            }
            $members = DB::table('staff_thread_members as m')->join('usuario as u', 'u.id', '=', 'm.user_id')->where('m.thread_id', $thread)->where('u.estado', 'activo')->whereNull('u.deleted_at')->whereExists(fn ($q) => $q->selectRaw('1')->from('usuario_rol as ur')->join('rol as r', 'r.id', '=', 'ur.rol_id')->whereColumn('ur.usuario_id', 'u.id')->where('r.nombre', '!=', 'cliente'))->pluck('u.id');
            abort_if($members->count() < 2, 422, 'Necesitas otro trabajador activo en la conversación.');
            $id = (string) Str::uuid();
            $title = trim($data['title'] ?? '') ?: $threadRow->title;
            DB::table('staff_calls')->insert(['id' => $id, 'thread_id' => $thread, 'created_by' => $user->id, 'request_id' => $data['request_id'], 'title' => $title, 'kind' => $data['kind'], 'status' => $scheduled ? 'scheduled' : 'ringing', 'scheduled_at' => $scheduled ? Carbon::parse($data['scheduled_at'])->setTimezone(config('app.timezone')) : null,
                'expires_at' => $scheduled ? null : now()->addSeconds(config('team.ring_seconds')), 'created_at' => now(), 'updated_at' => now()]);
            foreach ($members as $member) {
                DB::table('staff_call_participants')->insert(['call_id' => $id, 'user_id' => $member, 'state' => ! $scheduled && $member === $user->id ? 'joined' : 'invited', 'client_id' => ! $scheduled && $member === $user->id ? $data['client_id'] : null,
                    'joined_at' => ! $scheduled && $member === $user->id ? now() : null, 'last_seen_at' => ! $scheduled && $member === $user->id ? now() : null, 'video_enabled' => ! $scheduled && $member === $user->id && $data['kind'] === 'video']);
            }
            DB::table('staff_messages')->insert(['thread_id' => $thread, 'user_id' => $user->id, 'request_id' => $data['request_id'], 'body' => $scheduled ? 'Reunión programada: '.$title : ($data['kind'] === 'video' ? 'Videollamada iniciada' : 'Llamada de voz iniciada'), 'call_id' => $id, 'created_at' => now(), 'updated_at' => now()]);
            DB::table('staff_threads')->where('id', $thread)->update(['updated_at' => now()]);
            TeamAccess::log($thread, $scheduled ? 'meeting_scheduled' : 'call_started', ['call_id' => $id]);

            return $id;
        });
        $this->calls->notify($id);
        TeamAccess::notify($thread);

        return response()->json($this->calls->data($this->calls->access($id)), 201);
    }

    public function listing(Request $request)
    {
        $user = TeamAccess::user();
        $this->calls->expire();
        $calls = DB::table('staff_calls as c')->join('staff_call_participants as p', 'p.call_id', '=', 'c.id')->join('staff_thread_members as m', fn ($j) => $j->on('m.thread_id', '=', 'c.thread_id')->on('m.user_id', '=', 'p.user_id'))
            ->where('p.user_id', $user->id)->select('c.*')->orderByDesc('c.created_at')->limit(100)->get();
        $participants = DB::table('staff_call_participants as p')->join('usuario as u', 'u.id', '=', 'p.user_id')->whereIn('call_id', $calls->pluck('id'))->get(['p.*', 'u.nombres', 'u.apellidos'])->groupBy('call_id');

        return response()->json($calls->map(fn ($call) => $this->calls->data($call, $participants[$call->id] ?? collect())));
    }

    public function state(Request $request, string $call)
    {
        $this->calls->access($call);
        $this->calls->expire($call);
        $data = $request->validate(['after' => 'nullable|integer|min:0', 'client_id' => 'nullable|uuid']);
        $row = $this->calls->access($call);
        $signals = collect();
        if (in_array($row->status, ['ringing', 'active']) && ! empty($data['client_id'])) {
            $self = $this->calls->requireClient($call, $data['client_id']);
            $signals = DB::table('staff_call_signals')->where('call_id', $call)->where('target_id', TeamAccess::user()->id)->where('id', '>', $data['after'] ?? 0)->where('created_at', '>=', $self->joined_at)->orderBy('id')->limit(200)->get()->map(fn ($signal) => ['id' => $signal->id, 'from_id' => $signal->from_id, 'client_id' => $signal->client_id, 'kind' => $signal->kind, 'payload' => json_decode($signal->payload, true)]);
        }

        return response()->json(['call' => $this->calls->data($row), 'signals' => $signals]);
    }

    public function join(Request $request, string $call)
    {
        $this->calls->access($call);
        $this->calls->expire($call);
        $user = TeamAccess::user();
        TeamAccess::profile($user->id);
        $data = $request->validate(['client_id' => 'required|uuid', 'video_enabled' => 'required|boolean', 'take_over' => 'sometimes|boolean']);
        $threadId = $this->calls->access($call)->thread_id;
        $signalCursor = DB::transaction(function () use ($call, $data, $user, $threadId) {
            DB::table('staff_threads')->where('id', $threadId)->lockForUpdate()->first();
            $row = DB::table('staff_calls')->where('id', $call)->lockForUpdate()->first();
            TeamAccess::thread($row->thread_id);
            abort_if(DB::table('staff_calls')->where('thread_id', $row->thread_id)->where('id', '!=', $call)->whereIn('status', ['ringing', 'active'])->exists(), 409, 'Este chat ya tiene otra llamada activa.');
            abort_if($row->status === 'ended', 409, 'Esta llamada finalizó.');
            if ($row->status === 'scheduled') {
                abort_unless((int) $row->created_by === $user->id || now()->addMinutes(5)->greaterThanOrEqualTo($row->scheduled_at), 422, 'La reunión todavía no comienza.');
                DB::table('staff_calls')->where('id', $call)->update(['status' => 'ringing', 'expires_at' => now()->addSeconds(config('team.ring_seconds')), 'updated_at' => now()]);
            }
            DB::table('staff_worker_profiles')->where('user_id', $user->id)->lockForUpdate()->first();
            $this->calls->checkBusy($user->id, $call);
            $self = DB::table('staff_call_participants')->where('call_id', $call)->where('user_id', $user->id)->first();
            abort_if($self->state === 'joined' && $self->client_id !== $data['client_id'] && empty($data['take_over']) && now()->diffInSeconds($self->last_seen_at, true) < config('team.heartbeat_seconds'), 409, 'Ya estás en esta reunión desde otra pestaña.');
            $count = DB::table('staff_call_participants')->where('call_id', $call)->where('state', 'joined')->where('user_id', '!=', $user->id)->count();
            abort_if($count >= config('team.max_participants'), 409, 'La sala alcanzó su capacidad de participantes.');
            $cursor = (int) DB::table('staff_call_signals')->where('call_id', $call)->where('target_id', $user->id)->max('id');
            DB::table('staff_call_participants')->where('call_id', $call)->where('user_id', $user->id)->update(['state' => 'joined', 'client_id' => $data['client_id'], 'joined_at' => now(), 'left_at' => null, 'last_seen_at' => now(), 'video_enabled' => $data['video_enabled'], 'audio_muted' => false, 'screen_sharing' => false]);
            if ($count > 0) {
                DB::table('staff_calls')->where('id', $call)->update(['status' => 'active', 'started_at' => $row->started_at ?: now(), 'updated_at' => now()]);
            }

            return $cursor;
        });
        $this->calls->notify($call);

        return response()->json($this->calls->data($this->calls->access($call)) + ['signal_cursor' => $signalCursor]);
    }

    public function heartbeat(Request $request, string $call)
    {
        $row = $this->calls->access($call);
        abort_unless(in_array($row->status, ['ringing', 'active']), 409);
        $data = $request->validate(['client_id' => 'required|uuid', 'audio_muted' => 'required|boolean', 'video_enabled' => 'required|boolean', 'screen_sharing' => 'required|boolean', 'hand_raised' => 'required|boolean']);
        $this->calls->requireClient($call, $data['client_id']);
        DB::table('staff_call_participants')->where('call_id', $call)->where('user_id', TeamAccess::user()->id)->update(['last_seen_at' => now()] + $data);

        return response()->json(['ok' => true]);
    }

    public function signal(Request $request, string $call)
    {
        $row = $this->calls->access($call);
        abort_unless(in_array($row->status, ['ringing', 'active']), 409);
        $data = $request->validate(['client_id' => 'required|uuid', 'request_id' => 'required|uuid', 'target_id' => 'required|integer', 'kind' => 'required|in:offer,answer,ice', 'payload' => 'required|array']);
        $this->calls->requireClient($call, $data['client_id']);
        abort_unless((int) $data['target_id'] !== TeamAccess::user()->id && DB::table('staff_call_participants')->where('call_id', $call)->where('user_id', $data['target_id'])->where('state', 'joined')->exists(), 403);
        if ($data['kind'] === 'ice') {
            $request->validate(['payload.candidate' => 'required|string|max:4096', 'payload.sdpMid' => 'nullable|string|max:100', 'payload.sdpMLineIndex' => 'nullable|integer|min:0|max:64', 'payload.usernameFragment' => 'nullable|string|max:128']);
            $payload = array_intersect_key($data['payload'], array_flip(['candidate', 'sdpMid', 'sdpMLineIndex', 'usernameFragment']));
        } else {
            $request->validate(['payload.type' => 'required|in:offer,answer', 'payload.sdp' => 'required|string|max:60000']);
            abort_unless($data['payload']['type'] === $data['kind'], 422);
            $payload = ['type' => $data['kind'], 'sdp' => $data['payload']['sdp']];
        }
        $existing = DB::table('staff_call_signals')->where('call_id', $call)->where('from_id', TeamAccess::user()->id)->where('request_id', $data['request_id'])->first();
        abort_if($existing && ((int) $existing->target_id !== (int) $data['target_id'] || $existing->client_id !== $data['client_id'] || $existing->kind !== $data['kind'] || json_decode($existing->payload, true) !== $payload), 409, 'Este identificador ya pertenece a otra señal.');
        DB::table('staff_call_signals')->insertOrIgnore(['call_id' => $call, 'from_id' => TeamAccess::user()->id, 'target_id' => $data['target_id'], 'client_id' => $data['client_id'], 'request_id' => $data['request_id'], 'kind' => $data['kind'], 'payload' => json_encode($payload, JSON_THROW_ON_ERROR), 'created_at' => now()]);
        $this->calls->notify($call, $data['target_id']);

        return response()->json(['ok' => true]);
    }

    public function leave(Request $request, string $call)
    {
        $row = $this->calls->access($call);
        $data = $request->validate(['client_id' => 'nullable|uuid', 'decline' => 'sometimes|boolean', 'end_for_all' => 'sometimes|boolean']);
        if (! empty($data['end_for_all'])) {
            abort_unless((int) $row->created_by === TeamAccess::user()->id, 403);
            $this->calls->finish($call, 'host_ended');
        } else {
            if (empty($data['decline'])) {
                $this->calls->requireClient($call, $data['client_id'] ?? '');
            } else {
                abort_unless(DB::table('staff_call_participants')->where('call_id', $call)->where('user_id', TeamAccess::user()->id)->where('state', 'invited')->exists(), 409);
            }
            DB::table('staff_call_participants')->where('call_id', $call)->where('user_id', TeamAccess::user()->id)->update(['state' => ! empty($data['decline']) ? 'declined' : 'left', 'left_at' => now(), 'client_id' => null]);
            $this->calls->expire($call);
            $this->calls->notify($call);
        }

        return response()->json(['ok' => true]);
    }

    public function updateMeeting(Request $request, string $call)
    {
        $row = $this->calls->access($call);
        abort_unless((int) $row->created_by === TeamAccess::user()->id, 403);
        $data = $request->validate(['cancel' => 'sometimes|boolean', 'title' => 'required_without:cancel|string|max:120', 'scheduled_at' => 'required_without:cancel|date|after:now']);
        abort_if(empty($data['cancel']) && (empty($data['scheduled_at']) || trim($data['title'] ?? '') === ''), 422, 'Completa el título y la fecha.');
        DB::transaction(function () use ($call, $data) {
            $row = DB::table('staff_calls')->where('id', $call)->lockForUpdate()->first();
            $this->calls->access($call);
            abort_unless((int) $row->created_by === TeamAccess::user()->id, 403);
            abort_unless($row->status === 'scheduled', 409, 'Solo se pueden modificar reuniones que todavía no comienzan.');
            if (! empty($data['cancel'])) {
                $this->calls->finish($call, 'cancelled');
                TeamAccess::log($row->thread_id, 'meeting_cancelled', ['call_id' => $call]);
            } else {
                DB::table('staff_calls')->where('id', $call)->update(['title' => trim($data['title']), 'scheduled_at' => Carbon::parse($data['scheduled_at'])->setTimezone(config('app.timezone')), 'updated_at' => now()]);
                DB::table('staff_messages')->where('call_id', $call)->update(['body' => 'Reunión programada: '.trim($data['title']), 'updated_at' => now()]);
                TeamAccess::log($row->thread_id, 'meeting_updated', ['call_id' => $call]);
            }
            TeamAccess::notify($row->thread_id);
        });
        $this->calls->notify($call);
        return response()->json($this->calls->data($this->calls->access($call)));
    }
}
