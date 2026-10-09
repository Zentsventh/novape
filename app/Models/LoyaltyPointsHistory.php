<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPointsHistory extends Model
{
    protected $table = 'loyalty_points_history';

    protected $fillable = [
        'usuario_id',
        'points',
        'type',
        'description',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
