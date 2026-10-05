<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClienteNota extends Model
{
    use HasFactory;

    protected $fillable = [
        'cliente_id',
        'autor_id',
        'nota',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cliente_id');
    }

    /** @return BelongsTo<Usuario, $this> */
    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'autor_id');
    }
}
