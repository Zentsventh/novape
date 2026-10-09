<?php
namespace App\Domain\Sales\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Representa el carrito temporal de un usuario antes de crear un pedido.
 *
 * - `id` (UUID) primaria.
 * - `user_id` referencia al cliente.
 * - `created_at`, `updated_at` timestamps.
 */
class Cart extends Entity
{
    protected $fillable = [
        'user_id',
    ];

    /**
     * Items del carrito.
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
