<?php
namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Entities\Order;
use App\Domain\Sales\Entities\OrderItem;
use App\Domain\Sales\Repositories\OrderRepositoryInterface;
use App\Domain\Sales\Repositories\OrderItemRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;

/**
 * Implementación Eloquent del repositorio de Order.
 */
class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function find(string $id): ?Order
    {
        return Order::find($id);
    }

    public function create(array $attributes): Order
    {
        return Order::create($attributes);
    }

    public function update(Order $order, array $attributes): bool
    {
        return $order->update($attributes);
    }

    public function delete(Order $order): bool
    {
        return $order->delete();
    }

    public function findByUserId(string $userId): Collection
    {
        return Order::where('user_id', $userId)->get();
    }
}

/**
 * Implementación Eloquent del repositorio de OrderItem.
 */
class EloquentOrderItemRepository implements OrderItemRepositoryInterface
{
    public function find(string $id): ?OrderItem
    {
        return OrderItem::find($id);
    }

    public function create(array $attributes): OrderItem
    {
        return OrderItem::create($attributes);
    }

    public function update(OrderItem $orderItem, array $attributes): bool
    {
        return $orderItem->update($attributes);
    }

    public function delete(OrderItem $orderItem): bool
    {
        return $orderItem->delete();
    }

    public function findByOrderId(string $orderId): Collection
    {
        return OrderItem::where('order_id', $orderId)->get();
    }
}
