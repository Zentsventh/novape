<?php
namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Entities\OrderItem;
use Illuminate\Support\Collection;

/**
 * Interface para el repositorio de ítems de pedido.
 */
interface OrderItemRepositoryInterface
{
    public function find(string $id): ?OrderItem;

    public function create(array $attributes): OrderItem;

    public function update(OrderItem $orderItem, array $attributes): bool;

    public function delete(OrderItem $orderItem): bool;

    /**
     * Obtiene todos los ítems de un pedido.
     */
    public function findByOrderId(string $orderId): Collection;
}
