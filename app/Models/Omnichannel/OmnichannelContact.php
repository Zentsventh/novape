<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OmnichannelContact extends Model
{
    protected $table = 'omnichannel_contacts';

    protected $fillable = [
        'name', 'phone_number', 'messenger_id', 'instagram_id', 'email',
        'profile_picture_url', 'notes', 'metadata', 'is_blocked',
        'usuario_id', 'first_interaction_at', 'last_interaction_at',
    ];

    protected $casts = [
        'metadata' => 'json',
        'is_blocked' => 'boolean',
        'first_interaction_at' => 'datetime',
        'last_interaction_at' => 'datetime',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Usuario::class, 'usuario_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(OmnichannelConversation::class, 'contact_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(OmnichannelMessage::class, 'contact_id');
    }

    /**
     * Obtener las iniciales del nombre para el avatar.
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', trim($this->name));
        if (count($words) >= 2) {
            return strtoupper(mb_substr($words[0], 0, 1) . mb_substr($words[1], 0, 1));
        }
        return strtoupper(mb_substr($this->name, 0, 2));
    }
}
