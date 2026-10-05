<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmDealProduct extends Model
{
    protected $table = 'crm_deal_products';

    protected $fillable = [
        'crm_deal_id',
        'producto_id',
        'variante_id',
        'sku',
        'producto_nombre',
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal',
    ];

    /** @return BelongsTo<CrmDeal, $this> */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(CrmDeal::class, 'crm_deal_id');
    }

    /** @return BelongsTo<Producto, $this> */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
