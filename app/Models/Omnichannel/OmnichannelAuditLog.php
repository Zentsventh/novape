<?php

namespace App\Models\Omnichannel;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OmnichannelAuditLog extends Model
{
    protected $table = 'omnichannel_audit_logs';

    protected $fillable = [
        'conversation_id',
        'user_id',
        'action',
        'description',
        'meta_data',
    ];

    protected $casts = [
        'meta_data' => 'array',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(OmnichannelConversation::class, 'conversation_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }
}
