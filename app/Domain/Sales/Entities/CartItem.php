<?php
namespace App\Domain\Sales\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Ítem dentro del carrito de compras.
 *
 * - `id` (UUID) primaria.
 * - `cart_id` referencia al carrito.
 * - `product_id` referencia al producto.
 * - `quantity` cantidad deseada.
 */
class CartItem extends Entity
{
    protected $fillable = [
        'cart_id',
        'product_id',
        'quantity',
    ];

    /**
     * Relación al carrito padre.
     */
    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    /**
     * Relación al producto del catálogo.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo('\App\Domain\Catalog\Entities\Product');
    }
}
