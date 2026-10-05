<?php

namespace App\Models\Omnichannel;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OmnichannelAgentConfig extends Model
{
    protected $table = 'omnichannel_agent_configs';

    protected $fillable = [
        'usuario_id',
        'status',
        'max_chats',
        'skills',
    ];

    protected $casts = [
        'skills' => 'array',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
