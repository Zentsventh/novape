<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Models\CrmTimelineEvent;
use Illuminate\Database\Eloquent\Model;

class TimelineService
{
    public static function log(Model $trackable, string $eventType, ?string $description = null, array $metadata = []): void
    {
        CrmTimelineEvent::create([
            'trackable_id' => $trackable->getKey(),
            'trackable_type' => $trackable->getMorphClass(),
            'event_type' => $eventType,
            'descripcion' => $description,
            'metadata' => empty($metadata) ? null : $metadata,
            'usuario_id' => auth()->id(), // Assuming a user is authenticated
        ]);
    }
}
