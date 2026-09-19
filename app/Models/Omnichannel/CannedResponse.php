<?php

declare(strict_types=1);

namespace App\Models\Omnichannel;

use Illuminate\Database\Eloquent\Model;

class CannedResponse extends Model
{
    protected $table = 'omnichannel_canned_responses';

    protected $fillable = [
        'shortcut', 'title', 'content', 'category', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
