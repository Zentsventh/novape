<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoyaltyPointsHistory extends Model
{
    protected $table = 'loyalty_points_history';

    protected $fillable = [
        'usuario_id',
        'points',
        'type',
        'description',
    ];

    public function user()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
