<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RmaItem extends Model
{
    protected $fillable = ['rma_request_id', 'pedido_item_id', 'cantidad', 'condicion'];

    public function pedidoItem(): BelongsTo
    {
        return $this->belongsTo(PedidoItem::class);
    }
}
