<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransaccionPago extends Model
{
    protected $table = 'transacciones_pago';

    protected $fillable = [
        'pedido_id',
        'payment_intent_id',
        'pasarela',
        'monto',
        'estado',
        'error_message'
    ];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }
}
