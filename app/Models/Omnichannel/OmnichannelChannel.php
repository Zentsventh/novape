<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use Illuminate\Database\Eloquent\Model;

class OmnichannelChannel extends Model
{
    protected $table = 'omnichannel_channels';

    protected $fillable = [
        'channel', 'channel_name', 'phone_number_id', 'whatsapp_business_id',
        'page_id', 'instagram_account_id', 'access_token', 'webhook_verify_token',
        'is_active', 'is_verified', 'last_webhook_at', 'settings',
    ];

    protected $casts = [
        'settings' => 'json',
        'is_active' => 'boolean',
        'is_verified' => 'boolean',
        'last_webhook_at' => 'datetime',
    ];

    protected $hidden = ['access_token'];
}
