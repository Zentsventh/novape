<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OmnichannelConversation extends Model
{
    protected $table = 'omnichannel_conversations';

    protected $fillable = [
        'contact_id', 'assigned_user_id', 'channel', 'status', 'priority',
        'subject', 'is_bot_paused', 'bot_paused_at', 'bot_paused_by',
        'auto_assigned', 'last_message_at', 'last_message_preview',
        'message_count', 'unread_count', 'resolved_at', 'resolved_by',
    ];

    protected $casts = [
        'bot_paused_at' => 'datetime',
        'last_message_at' => 'datetime',
        'resolved_at' => 'datetime',
        'is_bot_paused' => 'boolean',
        'auto_assigned' => 'boolean',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(OmnichannelContact::class, 'contact_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'assigned_user_id');
    }

    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'resolved_by');
    }

    public function botPausedByUser(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'bot_paused_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(OmnichannelMessage::class, 'conversation_id');
    }
}
