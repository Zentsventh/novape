<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmTimelineEvent extends Model
{
    protected $table = 'crm_timeline_events';

    protected $fillable = [
        'trackable_id',
        'trackable_type',
        'event_type',
        'descripcion',
        'metadata',
        'usuario_id'
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function trackable(): MorphTo
    {
        return $this->morphTo();
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
