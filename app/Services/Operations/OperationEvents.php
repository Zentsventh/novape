<?php

declare(strict_types=1);

namespace App\Services\Operations;

use Illuminate\Support\Facades\DB;

final class OperationEvents
{
    public static function record(string $event, string $table, ?int $id, array $details, ?int $actor = null): void
    {
        // Call inside the business transaction. Only explicitly selected fields are
        // recorded; never entire requests, customer profiles, tokens or credentials.
        $actor ??= auth('admin')->id();
        DB::table('operation_events')->insert(['event' => $event, 'source_table' => $table, 'source_id' => $id,
            'actor_id' => $actor, 'actor_type' => $actor ? 'user' : 'system',
            'correlation_id' => app()->runningInConsole() ? null : substr((string) request()->header('X-Request-ID'), 0, 100),
            'details' => json_encode($details, JSON_THROW_ON_ERROR), 'created_at' => now()]);
    }
}
