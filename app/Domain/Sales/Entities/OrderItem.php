<?php
namespace App\Domain\Sales\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa un ítem dentro de un pedido.
 *
 * - `id` (UUID) primaria.
 * - `order_id` referencia al pedido.
 * - `product_id` referencia al producto del catálogo.
 * - `quantity` número de unidades.
 * - `unit_price` precio unitario en el momento de la compra.
 */
class OrderItem extends Entity
{
    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'unit_price',
    ];

    /**
     * Relación al pedido padre.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relación al producto del catálogo.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo('\App\Domain\Catalog\Entities\Product');
    }
}
