<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CrmNote extends Model
{
    use SoftDeletes;

    protected $table = 'crm_notes';

    protected $fillable = [
        'notable_id',
        'notable_type',
        'contenido',
        'usuario_id',
    ];

    public function notable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<Usuario, $this> */
    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
