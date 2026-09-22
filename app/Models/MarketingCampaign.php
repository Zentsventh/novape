<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingCampaign extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'subject',
        'content',
        'status',
        'segment',
        'target_count',
        'author_id',
        'sent_count',
        'opened_count',
        'clicked_count',
        'scheduled_at',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'author_id');
    }
}
