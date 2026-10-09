<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminNotification extends Model
{
    protected $table = 'admin_notifications';

    protected $fillable = [
        'user_id', 'type', 'title', 'body', 'icon', 'color', 'link', 'data', 'read_at',
    ];

    protected $casts = [
        'data' => 'json',
        'read_at' => 'datetime',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        });
    }

    /**
     * Helper estático para crear una notificación rápidamente.
     */
    public static function send(string $type, string $title, ?string $body = null, array $options = []): self
    {
        return self::create([
            'user_id' => $options['user_id'] ?? null,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'icon' => $options['icon'] ?? 'bell',
            'color' => $options['color'] ?? 'blue',
            'link' => $options['link'] ?? null,
            'data' => $options['data'] ?? null,
        ]);
    }
}
