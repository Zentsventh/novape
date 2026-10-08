<?php

declare(strict_types=1);

namespace App\Services\Marketing;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class MarketingConsent
{
    /** @return Builder<Usuario> */
    public static function audience(): Builder
    {
        return Usuario::where('estado', 'activo')->whereNotNull('email')
            ->whereHas('roles', fn ($q) => $q->where('nombre', 'cliente'))
            ->where('custom_fields->store_consent->promotions', true);
    }

    public static function allows(Usuario $user): bool
    {
        return $user->estado === 'activo' && (bool) data_get($user->custom_fields, 'store_consent.promotions', false);
    }

    public static function update(Usuario $user, bool $allowed): void
    {
        DB::transaction(function () use ($user, $allowed) {
            $locked = Usuario::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $fields = $locked->custom_fields->toArray();
            data_set($fields, 'store_consent.promotions', $allowed);
            data_set($fields, 'store_consent.promotions_updated_at', now()->toIso8601String());
            $locked->forceFill(['custom_fields' => $fields])->save();
        });
    }
}
