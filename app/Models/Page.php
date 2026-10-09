<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'sections', 'is_active'];

    protected $casts = [
        'sections' => 'array',
        'is_active' => 'boolean',
    ];
}
