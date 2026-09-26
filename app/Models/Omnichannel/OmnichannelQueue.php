<?php

namespace App\Models\Omnichannel;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OmnichannelQueue extends Model
{
    protected $table = 'omnichannel_queues';

    protected $fillable = [
        'conversation_id',
        'priority',
        'required_skill',
        'queued_at',
    ];

    protected $casts = [
        'queued_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(OmnichannelConversation::class, 'conversation_id');
    }
}
