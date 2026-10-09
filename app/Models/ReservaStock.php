<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReservaStock extends Model
{
    protected $table = 'reservas_stock';

    protected $fillable = [
        'session_id',
        'variante_id',
        'cantidad',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime'
    ];

    public function variante(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Variante::class, 'variante_id');
    }
}
