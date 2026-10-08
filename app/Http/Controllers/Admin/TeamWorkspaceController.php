<?php

namespace App\Http\Controllers\Admin;

use App\Events\Staff\ThreadUpdated;
use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Services\Team\TeamAccess;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TeamWorkspaceController extends Controller
{
    public function create(Request $request)
    {
        $user = TeamAccess::user();
        $data = $request->validate(['members' => 'required|array|min:1|max:24', 'members.*' => 'required|integer|distinct', 'title' => 'nullable|string|max:120', 'is_group' => 'sometimes|boolean']);
        $ids = array_values(array_unique([...$data['members'], $user->id]));
        abort_unless(count($ids) >= 2 && Usuario::whereIn('id', $ids)->where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', '!=', 'cliente'))->count() === count($ids), 422, 'Selecciona trabajadores activos.');
        $group = (bool) ($data['is_group'] ?? false);
        abort_if(! $group && count($ids) !== 2, 422, 'Un chat directo tiene dos participantes.');
        $title = trim($data['title'] ?? '') ?: 'Conversación de equipo';
        sort($ids);
        $key = $group ? null : implode(':', $ids);
        $id = DB::transaction(function () use ($ids, $key, $title, $user) {
            if ($key) {
                DB::table('staff_threads')->insertOrIgnore(['title' => $title, 'direct_key' => $key, 'created_by' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
                $id = DB::table('staff_threads')->where('direct_key', $key)->value('id');
            } else {
                $id = DB::table('staff_threads')->insertGetId(['title' => $title, 'created_by' => $user->id, 'created_at' => now(), 'updated_at' => now()]);
            }
            foreach ($ids as $member) {
                DB::table('staff_thread_members')->insertOrIgnore(['thread_id' => $id, 'user_id' => $member, 'last_read_id' => 0]);
            }
            return (int) $id;
        });
        $this->notify($id);
        return response()->json(DB::table('staff_threads')->find($id), 201);
    }

    public function read(Request $request, int $thread)
    {
        TeamAccess::thread($thread);
        $data = $request->validate(['message_id' => 'required|integer|min:1']);
        abort_unless(DB::table('staff_messages')->where('thread_id', $thread)->where('id', $data['message_id'])->exists(), 422);
        if (DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', TeamAccess::user()->id)->where('last_read_id', '<', $data['message_id'])->update(['last_read_id' => $data['message_id']])) {
            $this->notify($thread);
        }
        return response()->json(['ok' => true]);
    }

    public function workers(Request $request)
    {
        TeamAccess::user();
        $data = $request->validate(['q' => 'nullable|string|max:100']);
        $query = Usuario::where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', '!=', 'cliente'));
        if (! empty($data['q'])) {
            $term = $data['q'];
            $query->where(function ($q) use ($term) {
                $q->where('nombres', 'like', "%{$term}%")->orWhere('apellidos', 'like', "%{$term}%")->orWhereIn('id', DB::table('staff_worker_profiles')->where('extension', 'like', "%{$term}%")->select('user_id'));
                if (ctype_digit($term) && (int) $term > 10000) {
                    $q->orWhere('id', (int) $term - 10000);
                }
                $words = preg_split('/\s+/', trim($term));
                if (count($words) > 1) {
                    $q->orWhere(function ($full) use ($words) {
                        foreach ($words as $word) {
                            $full->where(fn ($part) => $part->where('nombres', 'like', "%{$word}%")->orWhere('apellidos', 'like', "%{$word}%"));
                        }
                    });
                }
            });
        }
        $users = $query->with('roles')->orderBy('nombres')->get();
        if ($users->isNotEmpty()) {
            DB::table('staff_worker_profiles')->insertOrIgnore($users->map(fn ($user) => ['user_id' => $user->id, 'extension' => (string) (10000 + $user->id), 'availability' => 'available'])->all());
        }
        $profiles = DB::table('staff_worker_profiles')->whereIn('user_id', $users->pluck('id'))->get()->keyBy('user_id');

        return response()->json($users->map(function ($user) use ($profiles) {
            $profile = $profiles[$user->id];

            return ['id' => $user->id, 'nombres' => $user->nombres, 'apellidos' => $user->apellidos, 'extension' => $profile->extension, 'role' => $user->roles->pluck('nombre')->join(', '),
                'availability' => $profile->last_seen_at && now()->diffInSeconds($profile->last_seen_at, true) < 65 ? $profile->availability : 'offline'];
        }));
    }

    public function presence(Request $request)
    {
        $user = TeamAccess::user();
        $data = $request->validate(['availability' => 'nullable|in:available,busy,away,offline']);
        TeamAccess::profile($user->id);
        DB::table('staff_worker_profiles')->where('user_id', $user->id)->update(['last_seen_at' => now()] + $data);

        return response()->json(TeamAccess::profile($user->id));
    }

    public function threads()
    {
        $id = TeamAccess::user()->id;
        $threads = DB::table('staff_threads as t')->join('staff_thread_members as m', 'm.thread_id', '=', 't.id')->where('m.user_id', $id)->select('t.*', 'm.last_read_id', 'm.pinned', 'm.muted', 'm.archived')->orderByDesc('m.pinned')->orderByDesc('t.updated_at')->get();
        $members = DB::table('staff_thread_members as m')->join('usuario as u', 'u.id', '=', 'm.user_id')->leftJoin('staff_worker_profiles as p', 'p.user_id', '=', 'u.id')->whereIn('m.thread_id', $threads->pluck('id'))->get(['m.thread_id', 'm.last_read_id', 'm.typing_until', 'u.id', 'u.nombres', 'u.apellidos', 'u.estado', 'p.extension', 'p.availability', 'p.last_seen_at'])->groupBy('thread_id');
        $unread = DB::table('staff_messages as s')->join('staff_thread_members as m', 'm.thread_id', '=', 's.thread_id')->where('m.user_id', $id)->whereIn('s.thread_id', $threads->pluck('id'))->whereNull('s.deleted_at')->whereColumn('s.id', '>', 'm.last_read_id')->where('s.user_id', '!=', $id)->selectRaw('s.thread_id, COUNT(*) as total')->groupBy('s.thread_id')->pluck('total', 'thread_id');
        $latestIds = DB::table('staff_messages')->whereIn('thread_id', $threads->pluck('id'))->selectRaw('MAX(id) as id')->groupBy('thread_id');
        $latest = DB::table('staff_messages')->whereIn('id', $latestIds)->get()->keyBy('thread_id');
        foreach ($threads as $thread) {
            $thread->can_manage = ! $thread->direct_key && ((int) $thread->created_by === $id || TeamAccess::user()->esAdmin());
            $thread->unread = (int) ($unread[$thread->id] ?? 0);
            $thread->members = ($members[$thread->id] ?? collect())->map(function ($m) {
                $m->typing = $m->typing_until && now()->lessThan($m->typing_until);
                $m->availability = $m->estado === 'activo' && $m->last_seen_at && now()->diffInSeconds($m->last_seen_at, true) < 65 ? $m->availability : 'offline';
                unset($m->typing_until, $m->last_seen_at, $m->thread_id);

                return $m;
            });
            $last = $latest[$thread->id] ?? null;
            $thread->preview = $last ? ($last->deleted_at ? 'Mensaje eliminado' : ($last->body ?: 'Archivo adjunto')) : 'Nueva conversación';
            $thread->last_message_id = $last?->id;
            $thread->last_message_at = $last?->created_at;
            $thread->last_message_user_id = $last?->user_id;
        }

        return response()->json($threads);
    }

    private function notify(int $thread): void
    {
        TeamAccess::notify($thread);
    }

    private function serialize($messages)
    {
        $user = TeamAccess::user();
        $isAdmin = $user->esAdmin();
        $attachments = DB::table('staff_message_attachments')->whereIn('staff_message_id', $messages->pluck('id'))->get()->groupBy('staff_message_id');
        $reactions = DB::table('staff_message_reactions')->whereIn('message_id', $messages->pluck('id'))->get()->groupBy('message_id');
        $replies = DB::table('staff_messages as m')->join('usuario as u', 'u.id', '=', 'm.user_id')->whereIn('m.id', $messages->pluck('reply_to_id')->filter())->get(['m.id', 'm.body', 'm.deleted_at', 'u.nombres', 'u.apellidos'])->keyBy('id');
        $calls = DB::table('staff_calls')->whereIn('id', $messages->pluck('call_id')->filter())->get()->keyBy('id');

        return $messages->map(function ($m) use ($attachments, $reactions, $replies, $calls, $user, $isAdmin) {
            unset($m->payload_hash);
            $m->can_edit = ! $m->deleted_at && ! $m->call_id && (int) $m->user_id === $user->id;
            $m->can_delete = ! $m->deleted_at && ! $m->call_id && ((int) $m->user_id === $user->id || $isAdmin);
            $m->attachments = $m->deleted_at ? [] : ($attachments[$m->id] ?? collect())->map(fn ($a) => $this->attachmentData($a));
            $m->reactions = $m->deleted_at ? [] : ($reactions[$m->id] ?? collect())->groupBy('emoji')->map(fn ($rows, $emoji) => ['emoji' => $emoji, 'count' => $rows->count(), 'mine' => $rows->contains('user_id', $user->id)])->values();
            $reply = $replies[$m->reply_to_id] ?? null;
            $m->reply = $reply ? ['id' => $reply->id, 'name' => trim($reply->nombres.' '.$reply->apellidos), 'body' => $reply->deleted_at ? 'Mensaje eliminado' : mb_substr($reply->body ?: 'Archivo adjunto', 0, 250)] : null;
            $call = $calls[$m->call_id] ?? null;
            if ($call) {
                foreach (['scheduled_at', 'started_at', 'ended_at'] as $field) {
                    if ($call->$field) {
                        $call->$field = Carbon::parse($call->$field, config('app.timezone'))->toIso8601String();
                    }
                }
            }
            $m->call = $call ? ['id' => $call->id, 'kind' => $call->kind, 'status' => $call->status, 'title' => $call->title, 'scheduled_at' => $call->scheduled_at, 'started_at' => $call->started_at, 'ended_at' => $call->ended_at, 'end_reason' => $call->end_reason] : null;
            if ($m->deleted_at) {
                $m->body = null;
            }
            foreach (['created_at', 'updated_at', 'edited_at', 'deleted_at'] as $field) {
                if ($m->$field) {
                    $m->$field = Carbon::parse($m->$field, config('app.timezone'))->toIso8601String();
                }
            }

            return $m;
        });
    }

    private function attachmentData(object $a): array
    {
        return ['id' => $a->id, 'type' => $a->type, 'file_name' => $a->file_name, 'mime_type' => $a->mime_type, 'file_size' => $a->file_size, 'url' => $a->type === 'call' ? null : route('admin.team.attachment', $a->id), 'download_url' => $a->type === 'call' ? null : route('admin.team.attachment', ['attachment' => $a->id, 'download' => 1])];
    }

    public function messages(Request $request, int $thread)
    {
        TeamAccess::thread($thread);
        $data = $request->validate(['before' => 'nullable|integer|min:1', 'q' => 'nullable|string|max:150', 'ids' => 'sometimes|array|min:1|max:200', 'ids.*' => 'integer|min:1|distinct']);
        $query = DB::table('staff_messages as m')->join('usuario as u', 'u.id', '=', 'm.user_id')->where('m.thread_id', $thread);
        if (! empty($data['before'])) {
            $query->where('m.id', '<', $data['before']);
        }
        if (isset($data['ids'])) {
            $query->whereIn('m.id', $data['ids']);
            if (isset($data['q']) && $data['q'] !== '') {
                $query->whereNull('m.deleted_at')->where('m.body', 'like', '%'.$data['q'].'%');
            }
            return response()->json(['data' => $this->serialize($query->orderBy('m.id')->get(['m.*', 'u.nombres', 'u.apellidos'])), 'has_more' => false]);
        }
        if (isset($data['q']) && $data['q'] !== '') {
            $query->whereNull('m.deleted_at')->where('m.body', 'like', '%'.$data['q'].'%');
        }
        $rows = $query->orderByDesc('m.id')->limit(51)->get(['m.*', 'u.nombres', 'u.apellidos']);

        return response()->json(['data' => $this->serialize($rows->take(50)->reverse()->values()), 'has_more' => $rows->count() > 50]);
    }

    public function send(Request $request, int $thread)
    {
        TeamAccess::thread($thread);
        $data = $request->validate(['body' => 'nullable|string|max:5000', 'request_id' => 'required|uuid', 'reply_to_id' => 'nullable|integer', 'important' => 'nullable|boolean', 'kind' => 'nullable|in:file,voice', 'attachments' => 'nullable|array|max:6', 'attachments.*' => 'file|max:'.config('team.upload_max_kb').'|mimes:jpeg,png,jpg,gif,webp,mp4,mov,mp3,m4a,ogg,webm,wav,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,7z']);
        $files = $request->file('attachments', []);
        $body = trim($data['body'] ?? '');
        abort_if($body === '' && ! $files, 422, 'Escribe un mensaje o adjunta un archivo.');
        abort_if(array_sum(array_map(fn ($f) => $f->getSize(), $files)) > config('team.upload_total_bytes'), 422, 'El mensaje admite hasta 40 MB en archivos.');
        if (! empty($data['reply_to_id'])) {
            abort_unless(DB::table('staff_messages')->where('thread_id', $thread)->where('id', $data['reply_to_id'])->exists(), 422, 'La cita debe pertenecer a este chat.');
        }
        $hash = hash('sha256', json_encode([$body, $data['reply_to_id'] ?? null, (bool) ($data['important'] ?? false), $data['kind'] ?? 'file', array_map(fn ($f) => [$f->getClientOriginalName(), hash_file('sha256', $f->getRealPath())], $files)], JSON_THROW_ON_ERROR));
        $paths = [];
        try {
            $id = DB::transaction(function () use ($thread, $data, $body, $files, $hash, &$paths) {
                DB::table('staff_threads')->where('id', $thread)->lockForUpdate()->first();
                TeamAccess::thread($thread);
                $existing = DB::table('staff_messages')->where('thread_id', $thread)->where('request_id', $data['request_id'])->first();
                if ($existing) {
                    abort_unless((int) $existing->user_id === TeamAccess::user()->id && ($existing->payload_hash ? hash_equals($existing->payload_hash, $hash) : $existing->body === $body), 409, 'La clave de envío ya pertenece a otro mensaje.');

                    return $existing->id;
                }
                $id = DB::table('staff_messages')->insertGetId(['thread_id' => $thread, 'user_id' => TeamAccess::user()->id, 'request_id' => $data['request_id'], 'body' => $body, 'reply_to_id' => $data['reply_to_id'] ?? null, 'important' => $data['important'] ?? false, 'payload_hash' => $hash, 'created_at' => now(), 'updated_at' => now()]);
                foreach ($files as $file) {
                    $mime = $file->getMimeType() ?? 'application/octet-stream';
                    $voice = ($data['kind'] ?? '') === 'voice' && (str_starts_with($mime, 'audio/') || in_array($mime, ['video/webm', 'video/mp4']));
                    $type = $voice || str_starts_with($mime, 'audio/') ? 'audio' : (str_starts_with($mime, 'image/') ? 'image' : (str_starts_with($mime, 'video/') ? 'video' : 'document'));
                    $path = $file->store('team-chat', 'local');
                    abort_unless($path, 503, 'No se pudo guardar el archivo.');
                    $paths[] = $path;
                    DB::table('staff_message_attachments')->insert(['staff_message_id' => $id, 'type' => $type, 'file_path' => $path, 'storage_disk' => 'local', 'sha256' => hash_file('sha256', $file->getRealPath()), 'file_name' => mb_substr(basename(str_replace('\\', '/', $file->getClientOriginalName())), 0, 240), 'mime_type' => $voice && $mime === 'video/webm' ? 'audio/webm' : $mime, 'file_size' => $file->getSize(), 'created_at' => now(), 'updated_at' => now()]);
                }
                DB::table('staff_threads')->where('id', $thread)->update(['updated_at' => now()]);
                DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', TeamAccess::user()->id)->update(['typing_until' => null]);

                return $id;
            });
        } catch (\Throwable $e) {
            foreach ($paths as $path) {
                Storage::disk('local')->delete($path);
            } throw $e;
        }
        $this->notify($thread);
        $row = DB::table('staff_messages as m')->join('usuario as u', 'u.id', '=', 'm.user_id')->where('m.id', $id)->select('m.*', 'u.nombres', 'u.apellidos')->first();

        return response()->json($this->serialize(collect([$row]))->first(), 201);
    }

    public function attachment(Request $request, int $attachment)
    {
        $file = DB::table('staff_message_attachments as a')->join('staff_messages as m', 'm.id', '=', 'a.staff_message_id')->where('a.id', $attachment)->whereNull('m.deleted_at')->select('a.*', 'm.thread_id')->first();
        abort_unless($file && $file->type !== 'call', 404);
        TeamAccess::thread($file->thread_id);
        abort_unless(in_array($file->storage_disk, ['local', 'public']) && str_starts_with($file->file_path, 'team-chat/') && ! str_contains($file->file_path, '..'), 404);
        $disk = Storage::disk($file->storage_disk);
        abort_unless($disk->exists($file->file_path), 404);
        $inline = ! $request->boolean('download') && in_array($file->type, ['image', 'audio', 'video']);

        return response()->file($disk->path($file->file_path), ['Content-Type' => $file->mime_type ?: 'application/octet-stream', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff', 'Content-Security-Policy' => "sandbox; default-src 'none'"])->setContentDisposition($inline ? 'inline' : 'attachment', $file->file_name ?: 'archivo');
    }

    public function typing(Request $request, int $thread)
    {
        TeamAccess::thread($thread);
        $data = $request->validate(['typing' => 'required|boolean']);
        DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', TeamAccess::user()->id)->update(['typing_until' => $data['typing'] ? now()->addSeconds(6) : null]);
        $this->notify($thread);

        return response()->json(['ok' => true]);
    }

    public function preferences(Request $request, int $thread)
    {
        TeamAccess::thread($thread);
        $data = $request->validate(['pinned' => 'sometimes|boolean', 'muted' => 'sometimes|boolean', 'archived' => 'sometimes|boolean']);
        if ($data) {
            DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', TeamAccess::user()->id)->update($data);
        }

        $this->notify($thread);
        return response()->json(['ok' => true]);
    }

    public function edit(Request $request, int $thread, int $message)
    {
        TeamAccess::thread($thread);
        $row = DB::table('staff_messages')->where('thread_id', $thread)->where('id', $message)->whereNull('deleted_at')->first();
        abort_unless($row && ! $row->call_id && (int) $row->user_id === TeamAccess::user()->id, 403);
        $data = $request->validate(['body' => 'required|string|max:5000']);
        abort_if(trim($data['body']) === '', 422, 'Escribe el mensaje.');
        DB::transaction(function () use ($thread, $message, $data) {
            DB::table('staff_messages')->where('id', $message)->update(['body' => trim($data['body']), 'edited_at' => now(), 'updated_at' => now()]);
            TeamAccess::log($thread, 'message_edited', ['message_id' => $message]);
        });
        $this->notify($thread);

        return response()->json(['ok' => true]);
    }

    public function deleteMessage(Request $request, int $thread, int $message)
    {
        TeamAccess::thread($thread);
        $row = DB::table('staff_messages')->where('thread_id', $thread)->where('id', $message)->first();
        abort_unless($row && ! $row->call_id && ((int) $row->user_id === TeamAccess::user()->id || TeamAccess::user()->esAdmin()), 403);
        DB::transaction(function () use ($thread, $message) {
            DB::table('staff_messages')->where('id', $message)->update(['deleted_at' => now(), 'updated_at' => now()]);
            TeamAccess::log($thread, 'message_deleted', ['message_id' => $message]);
        });
        $this->notify($thread);

        return response()->json(['ok' => true]);
    }

    public function reaction(Request $request, int $thread, int $message)
    {
        TeamAccess::thread($thread);
        abort_unless(DB::table('staff_messages')->where('thread_id', $thread)->where('id', $message)->whereNull('deleted_at')->exists(), 404);
        $data = $request->validate(['emoji' => 'required|in:👍,❤️,😂,🎉,😮,✅', 'active' => 'required|boolean']);
        $where = ['message_id' => $message, 'user_id' => TeamAccess::user()->id, 'emoji' => $data['emoji']];
        if ($data['active']) {
            DB::table('staff_message_reactions')->insertOrIgnore($where);
        } else {
            DB::table('staff_message_reactions')->where($where)->delete();
        }
        $this->notify($thread);

        return response()->json(['ok' => true]);
    }

    public function files(Request $request, int $thread)
    {
        TeamAccess::thread($thread);
        $rows = DB::table('staff_message_attachments as a')->join('staff_messages as m', 'm.id', '=', 'a.staff_message_id')->where('m.thread_id', $thread)->whereNull('m.deleted_at')->where('a.type', '!=', 'call')->select('a.*')->orderByDesc('a.id')->paginate(30);
        $rows->setCollection($rows->getCollection()->map(fn ($file) => $this->attachmentData($file)));

        return response()->json($rows);
    }

    public function manage(Request $request, int $thread)
    {
        $row = TeamAccess::thread($thread);
        abort_unless(! $row->direct_key && ((int) $row->created_by === TeamAccess::user()->id || TeamAccess::user()->esAdmin()), 403);
        $data = $request->validate(['title' => 'required|string|max:120', 'members' => 'required|array|min:2|max:25', 'members.*' => 'integer|distinct', 'owner_id' => 'nullable|integer']);
        abort_if(trim($data['title']) === '', 422, 'Escribe el nombre del grupo.');
        abort_unless(Usuario::whereIn('id', $data['members'])->where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', '!=', 'cliente'))->count() === count($data['members']), 422);
        abort_unless(in_array(TeamAccess::user()->id, $data['members']), 422, 'Debes permanecer en el grupo.');
        $owner = $data['owner_id'] ?? (in_array((int) $row->created_by, $data['members']) ? $row->created_by : TeamAccess::user()->id);
        abort_unless(in_array((int) $owner, $data['members']), 422, 'El responsable debe pertenecer al grupo.');
        $removed = DB::transaction(function () use ($thread, $data, $owner) {
            $row = DB::table('staff_threads')->where('id', $thread)->lockForUpdate()->first();
            TeamAccess::thread($thread);
            abort_unless((int) $row->created_by === TeamAccess::user()->id || TeamAccess::user()->esAdmin(), 403);
            DB::table('staff_threads')->where('id', $thread)->update(['title' => trim($data['title']), 'created_by' => $owner, 'updated_at' => now()]);
            $removed = DB::table('staff_thread_members')->where('thread_id', $thread)->whereNotIn('user_id', $data['members'])->pluck('user_id');
            DB::table('staff_thread_members')->where('thread_id', $thread)->whereIn('user_id', $removed)->delete();
            DB::table('staff_call_participants')->whereIn('call_id', DB::table('staff_calls')->where('thread_id', $thread)->select('id'))->whereIn('user_id', $removed)->update(['state' => 'left', 'left_at' => now()]);
            foreach ($data['members'] as $id) {
                DB::table('staff_thread_members')->insertOrIgnore(['thread_id' => $thread, 'user_id' => $id, 'last_read_id' => 0]);
            }
            $this->syncInvitations($thread, $data['members']);
            TeamAccess::log($thread, 'group_updated', ['members' => $data['members'], 'owner_id' => $owner]);
            return $removed->all();
        });
        TeamAccess::notify($thread, $removed);

        return response()->json(['ok' => true]);
    }

    private function syncInvitations(int $thread, array $members): void
    {
        foreach (DB::table('staff_calls')->where('thread_id', $thread)->whereIn('status', ['scheduled', 'ringing', 'active'])->get() as $call) {
            if (! in_array((int) $call->created_by, $members)) {
                DB::table('staff_calls')->where('id', $call->id)->update(['created_by' => DB::table('staff_threads')->where('id', $thread)->value('created_by')]);
            }
            foreach ($members as $userId) {
                DB::table('staff_call_participants')->insertOrIgnore(['call_id' => $call->id, 'user_id' => $userId, 'state' => 'invited']);
            }
            app(\App\Services\Team\TeamCalls::class)->notify($call->id);
        }
        app(\App\Services\Team\TeamCalls::class)->expire();
    }

    public function leaveGroup(Request $request, int $thread)
    {
        $row = TeamAccess::thread($thread);
        abort_if($row->direct_key, 422, 'Puedes archivar un chat directo.');
        $user = TeamAccess::user();
        DB::transaction(function () use ($thread, $user) {
            $row = DB::table('staff_threads')->where('id', $thread)->lockForUpdate()->first();
            TeamAccess::thread($thread);
            $remaining = DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', '!=', $user->id)->orderBy('user_id')->pluck('user_id');
            abort_if($remaining->isEmpty(), 422, 'El grupo debe conservar al menos un miembro.');
            TeamAccess::log($thread, 'group_left');
            DB::table('staff_thread_members')->where('thread_id', $thread)->where('user_id', $user->id)->delete();
            DB::table('staff_threads')->where('id', $thread)->update(['created_by' => (int) $row->created_by === $user->id ? $remaining->first() : $row->created_by, 'updated_at' => now()]);
            DB::table('staff_call_participants')->whereIn('call_id', DB::table('staff_calls')->where('thread_id', $thread)->whereIn('status', ['scheduled', 'ringing', 'active'])->select('id'))->where('user_id', $user->id)->update(['state' => 'left', 'left_at' => now(), 'client_id' => null]);
            $this->syncInvitations($thread, $remaining->all());
        });
        TeamAccess::notify($thread, [$user->id]);
        return response()->json(['ok' => true]);
    }
}
