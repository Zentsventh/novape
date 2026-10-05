<?php

namespace App\Http\Controllers\Admin;

use App\Events\Staff\ThreadUpdated;
use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TeamChatController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Team/Index');
    }

    public function workers(Request $request)
    {
        $data = $request->validate(['q' => 'nullable|string|max:100']);
        $query = Usuario::where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', '!=', 'cliente'));
        if (! empty($data['q'])) {
            $query->where(fn ($q) => $q->where('nombres', 'like', '%'.$data['q'].'%')->orWhere('apellidos', 'like', '%'.$data['q'].'%'));
        }

        return response()->json($query->whereKeyNot(auth('admin')->id())->orderBy('nombres')->limit(30)->get(['id', 'nombres', 'apellidos']));
    }

    public function threads()
    {
        $id = auth('admin')->id();
        $threads = DB::table('staff_threads as t')->join('staff_thread_members as m', 'm.thread_id', '=', 't.id')
            ->where('m.user_id', $id)->select('t.*', 'm.last_read_id')->orderByDesc('t.updated_at')->limit(100)->get();
        $members = DB::table('staff_thread_members as m')->join('usuario as u', 'u.id', '=', 'm.user_id')
            ->whereIn('m.thread_id', $threads->pluck('id'))->get(['m.thread_id', 'm.last_read_id', 'u.id', 'u.nombres', 'u.apellidos'])->groupBy('thread_id');
        $unread = DB::table('staff_messages as s')->join('staff_thread_members as m', 'm.thread_id', '=', 's.thread_id')
            ->where('m.user_id', $id)->whereIn('s.thread_id', $threads->pluck('id'))->whereColumn('s.id', '>', 'm.last_read_id')->where('s.user_id', '!=', $id)
            ->selectRaw('s.thread_id, COUNT(*) as total')->groupBy('s.thread_id')->pluck('total', 'thread_id');
        foreach ($threads as $thread) {
            $thread->unread = (int) ($unread[$thread->id] ?? 0);
            $thread->members = $members[$thread->id] ?? [];
        }

        return response()->json($threads);
    }

    public function create(Request $request)
    {
        $data = $request->validate(['members' => 'required|array|min:1|max:24', 'members.*' => 'required|integer|distinct', 'title' => 'nullable|string|max:120']);
        $ids = array_values(array_unique(array_merge($data['members'], [(int) auth('admin')->id()])));
        abort_unless(count($ids) >= 2 && Usuario::whereIn('id', $ids)->where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', '!=', 'cliente'))->count() === count($ids), 422, 'Selecciona trabajadores activos.');
        sort($ids);
        $key = count($ids) === 2 ? implode(':', $ids) : null;
        $threadId = DB::transaction(function () use ($ids, $key, $data) {
            $title = trim($data['title'] ?? '') ?: 'Conversación de equipo';
            if ($key) {
                DB::table('staff_threads')->insertOrIgnore(['title' => $title, 'direct_key' => $key, 'created_by' => auth('admin')->id(), 'created_at' => now(), 'updated_at' => now()]);
                $id = DB::table('staff_threads')->where('direct_key', $key)->value('id');
            } else {
                $id = DB::table('staff_threads')->insertGetId(['title' => $title, 'created_by' => auth('admin')->id(), 'created_at' => now(), 'updated_at' => now()]);
            }
            foreach ($ids as $userId) {
                DB::table('staff_thread_members')->insertOrIgnore(['thread_id' => $id, 'user_id' => $userId, 'last_read_id' => 0]);
            }

            return (int) $id;
        });
        $this->publish($threadId);

        return response()->json(DB::table('staff_threads')->find($threadId), 201);
    }

    private function member(int $thread): void
    {
        abort_unless(DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', auth('admin')->id())->exists(), 403);
    }

    private function publish(int $thread): void
    {
        try {
            event(new ThreadUpdated($thread));
        } catch (\Throwable $e) {
            // Messages are committed. The clients' periodic refresh still delivers them.
            Log::warning('Team realtime temporarily unavailable', ['thread_id' => $thread, 'type' => get_class($e)]);
        }
    }

    public function messages(Request $request, int $thread)
    {
        $this->member($thread);
        $data = $request->validate(['before' => 'nullable|integer|min:1']);
        $query = DB::table('staff_messages as m')->join('usuario as u', 'u.id', '=', 'm.user_id')->where('m.thread_id', $thread);
        if (! empty($data['before'])) {
            $query->where('m.id', '<', $data['before']);
        }
        $messages = $query->orderByDesc('m.id')->limit(50)->get(['m.*', 'u.nombres', 'u.apellidos'])->reverse()->values();

        return response()->json(['data' => $messages, 'has_more' => $messages->count() === 50]);
    }

    public function send(Request $request, int $thread)
    {
        $this->member($thread);
        $data = $request->validate(['body' => 'required|string|max:5000', 'request_id' => 'required|uuid']);
        abort_if(trim($data['body']) === '', 422, 'Escribe un mensaje.');
        $message = DB::transaction(function () use ($thread, $data) {
            DB::table('staff_threads')->where('id', $thread)->lockForUpdate()->first();
            $existing = DB::table('staff_messages')->where('thread_id', $thread)->where('request_id', $data['request_id'])->first();
            if ($existing) {
                abort_unless((int) $existing->user_id === (int) auth('admin')->id(), 409);

                return $existing;
            }
            $id = DB::table('staff_messages')->insertGetId(['thread_id' => $thread, 'user_id' => auth('admin')->id(), 'request_id' => $data['request_id'], 'body' => trim($data['body']), 'created_at' => now(), 'updated_at' => now()]);
            DB::table('staff_threads')->where('id', $thread)->update(['updated_at' => now()]);

            return DB::table('staff_messages')->find($id);
        });
        $this->publish($thread);

        return response()->json($message, 201);
    }

    public function read(Request $request, int $thread)
    {
        $this->member($thread);
        $data = $request->validate(['message_id' => 'required|integer|min:1']);
        abort_unless(DB::table('staff_messages')->where('thread_id', $thread)->where('id', $data['message_id'])->exists(), 422);
        $changed = DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', auth('admin')->id())->where('last_read_id', '<', $data['message_id'])->update(['last_read_id' => $data['message_id']]);
        if ($changed) {
            $this->publish($thread);
        }

        return response()->json(['ok' => true]);
    }
}
