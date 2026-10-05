<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OmnichannelConversation extends Model
{
    protected $table = 'omnichannel_conversations';

    protected $fillable = [
        'contact_id', 'assigned_user_id', 'channel', 'status', 'priority',
        'subject', 'is_bot_paused', 'bot_paused_at', 'bot_paused_by',
        'auto_assigned', 'last_message_at', 'last_message_preview',
        'message_count', 'unread_count', 'resolved_at', 'resolved_by',
        'closed_at', 'closed_by',
    ];

    protected $casts = [
        'bot_paused_at' => 'datetime',
        'last_message_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'is_bot_paused' => 'boolean',
        'auto_assigned' => 'boolean',
    ];

    /** @return BelongsTo<OmnichannelContact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(OmnichannelContact::class, 'contact_id');
    }

    /** @return BelongsTo<Usuario, $this> */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'assigned_user_id');
    }

    /** @return BelongsTo<Usuario, $this> */
    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'resolved_by');
    }

    /** @return BelongsTo<Usuario, $this> */
    public function botPausedByUser(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'bot_paused_by');
    }

    /** @return HasMany<OmnichannelMessage, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(OmnichannelMessage::class, 'conversation_id');
    }
}
