<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesAgentProfile extends Model
{
    protected $fillable = [
        'user_id', 'display_name', 'specialty', 'active', 'timezone', 'slot_minutes',
        'booking_days', 'notice_minutes', 'weekly_schedule', 'exceptions',
    ];

    protected $casts = [
        'active' => 'boolean', 'slot_minutes' => 'integer', 'booking_days' => 'integer',
        'notice_minutes' => 'integer', 'weekly_schedule' => 'array', 'exceptions' => 'array',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }

    public static function defaultSchedule(): array
    {
        return [
            '1' => [['start' => '09:00', 'end' => '18:00']],
            '2' => [['start' => '09:00', 'end' => '18:00']],
            '3' => [['start' => '09:00', 'end' => '18:00']],
            '4' => [['start' => '09:00', 'end' => '18:00']],
            '5' => [['start' => '09:00', 'end' => '18:00']],
            '6' => [['start' => '09:00', 'end' => '13:00']],
            '7' => [],
        ];
    }
}
