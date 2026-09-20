<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmDealProduct extends Model
{
    protected $table = 'crm_deal_products';

    protected $fillable = [
        'crm_deal_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal'
    ];

    public function deal()
    {
        return $this->belongsTo(CrmDeal::class, 'crm_deal_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
