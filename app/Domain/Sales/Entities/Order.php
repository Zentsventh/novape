<?php
namespace App\Domain\Sales\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa un pedido del cliente.
 *
 * - `id` (UUID) primaria.
 * - `user_id` referencia al cliente.
 * - `status` enum: pending, paid, shipped, completed, cancelled.
 * - `total_amount` (decimal) suma de los ítems.
 * - `created_at`, `updated_at` timestamps.
 */
class Order extends Entity
{
    /**
     * Los atributos asignables en masa.
     */
    protected $fillable = [
        'user_id',
        'status',
        'total_amount',
    ];

    /**
     * Relación 1:N con los ítems del pedido.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Relación con el usuario que realizó el pedido.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(config('auth.providers.users.model'));
    }
}
