<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use App\Models\Omnichannel\OmnichannelConversation;
use App\Models\Usuario;
use Illuminate\Broadcasting\PrivateChannel;

final class ConversationAccess
{
    public static function supervisor(?Usuario $user): bool
    {
        return $user && $user->estado === 'activo' && $user->esAdmin();
    }

    public static function authorize(OmnichannelConversation $conversation, bool $supervisorOnly = false): void
    {
        $user = auth('admin')->user();
        abort_unless($user && $user->estado === 'activo' && $user->tienePermiso('gestionar_omnichannel'), 403);
        abort_unless(self::supervisor($user) || (! $supervisorOnly && (int) $conversation->assigned_user_id === (int) $user->id), 403);
    }

    public static function agent(int $id): Usuario
    {
        $user = Usuario::where('estado', 'activo')->findOrFail($id);
        abort_unless($user->roles()->where('nombre', '!=', 'cliente')->exists() && $user->tienePermiso('gestionar_omnichannel'), 422, 'Selecciona un asesor activo con acceso a la bandeja.');

        return $user;
    }

    public static function channels(int $conversationId): array
    {
        $channels = [new PrivateChannel('novape-inbox.supervisors')];
        $owner = OmnichannelConversation::whereKey($conversationId)->value('assigned_user_id');
        if ($owner) {
            $channels[] = new PrivateChannel('novape-inbox.agent.'.$owner);
        }

        return $channels;
    }
}
