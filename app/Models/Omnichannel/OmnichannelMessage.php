<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OmnichannelMessage extends Model
{
    protected $table = 'omnichannel_messages';

    protected $fillable = [
        'conversation_id', 'contact_id', 'user_id', 'channel', 'direction',
        'message_type', 'content', 'media_url', 'media_mime_type', 'media_file_size',
        'is_ai_generated', 'ai_engine_used', 'ai_tokens_used', 'ai_response_time_ms',
        'is_internal_note', 'status', 'error_message', 'external_message_id', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'json',
        'is_ai_generated' => 'boolean',
        'is_internal_note' => 'boolean',
    ];

    /** @return BelongsTo<OmnichannelConversation, $this> */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(OmnichannelConversation::class, 'conversation_id');
    }

    /** @return BelongsTo<OmnichannelContact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(OmnichannelContact::class, 'contact_id');
    }

    /** @return BelongsTo<Usuario, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }
}
