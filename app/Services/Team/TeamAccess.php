<?php

namespace App\Services\Team;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

final class TeamAccess
{
    public static function notify(int $thread, array $recipients = []): void
    {
        try {
            event(new \App\Events\Staff\ThreadUpdated($thread, $recipients));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Team notification unavailable; polling remains active', ['thread_id' => $thread, 'exception' => get_class($e)]);
        }
    }

    public static function user(): Usuario
    {
        $user = auth('admin')->user();
        abort_unless($user && $user->estado === 'activo', 403);
        $user->loadMissing('roles');
        abort_unless($user->roles->contains(fn ($role) => $role->nombre !== 'cliente'), 403);

        return $user;
    }

    public static function thread(int $id): object
    {
        $user = self::user();
        abort_unless(DB::table('staff_thread_members')->where('thread_id', $id)->where('user_id', $user->id)->exists(), 403);

        return DB::table('staff_threads')->find($id) ?? abort(404);
    }

    public static function profile(int $userId): object
    {
        DB::table('staff_worker_profiles')->insertOrIgnore(['user_id' => $userId, 'extension' => (string) (10000 + $userId), 'availability' => 'available']);

        return DB::table('staff_worker_profiles')->where('user_id', $userId)->first();
    }

    public static function log(int $thread, string $action, array $metadata = [], ?int $actorId = null): void
    {
        DB::table('staff_activity_log')->insert(['thread_id' => $thread, 'user_id' => $actorId ?? self::user()->id, 'action' => $action, 'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR), 'created_at' => now()]);
    }
}
