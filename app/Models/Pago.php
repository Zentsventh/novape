<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pago';
    public $timestamps = false;

    protected $fillable = ['pedido_id', 'metodo', 'estado', 'monto'];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function pedido(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }
}
