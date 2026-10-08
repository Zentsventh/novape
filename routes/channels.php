<?php

use App\Services\Omnichannel\ConversationAccess;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('novape-team.user.{id}', fn ($user, $id) => (int) $user->id === (int) $id
    && $user->estado === 'activo' && $user->roles()->where('nombre', '!=', 'cliente')->exists(), ['guards' => ['admin']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Canal privado para la bandeja omnicanal.
 * Solo usuarios autenticados con guard 'admin' pueden escuchar.
 */
Broadcast::channel('novape-inbox.supervisors', fn ($user) => ConversationAccess::supervisor($user), ['guards' => ['admin']]);
Broadcast::channel('novape-inbox.agent.{id}', fn ($user, $id) => $user->estado === 'activo'
    && (int) $user->id === (int) $id && $user->tienePermiso('gestionar_omnichannel'), ['guards' => ['admin']]);

Broadcast::channel('staff-thread.{threadId}', function ($user, $threadId) {
    return $user->estado === 'activo' && $user->roles()->where('nombre', '!=', 'cliente')->exists() && \App\Models\StaffThread::where('id', $threadId)
        ->whereHas('members', fn($q) => $q->where('user_id', $user->id))
        ->exists();
}, ['guards' => ['admin']]);
