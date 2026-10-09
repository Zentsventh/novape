<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookLog extends Model
{
    protected $fillable = [
        'provider',
        'event_id',
        'type',
        'payload',
        'status',
        'exception_message'
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
