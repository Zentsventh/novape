<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Envio extends Model
{
    protected $table = 'envio';
    public $timestamps = false;

    protected $fillable = ['pedido_id', 'direccion_id', 'estado', 'proveedor', 'rate_id', 'tracking', 'transaction_id', 'label_url'];

    public function pedido(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }
}
