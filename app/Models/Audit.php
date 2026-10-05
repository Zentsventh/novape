<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Audit extends \OwenIt\Auditing\Models\Audit
{
    /** @return MorphTo<Model, $this> */
    public function user(): MorphTo
    {
        $prefix = config('audit.user.morph_prefix', 'user');

        return $this->morphTo(__FUNCTION__, $prefix.'_type', $prefix.'_id');
    }
}
