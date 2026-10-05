<?php
namespace App\Policies;

use App\Models\User;
use App\Domain\Sales\Entities\Order;

/**
 * Política de autorización para pedidos.
 */
class OrderPolicy
{
    /**
     * Determina si el usuario puede ver el pedido.
     */
    public function view(User $user, Order $order): bool
    {
        // Los administradores pueden ver cualquier pedido, los usuarios sólo los suyos.
        return $user->hasRole('admin') || $order->user_id === $user->id;
    }

    /**
     * Determina si el usuario puede crear un pedido.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('sales.order.create');
    }

    /**
     * Determina si el usuario puede actualizar el estado del pedido.
     */
    public function update(User $user, Order $order): bool
    {
        return $user->hasRole('admin') || $order->user_id === $user->id;
    }

    /**
     * Determina si el usuario puede cancelar (eliminar) el pedido.
     * En vez de eliminar físicamente, se usará el estado 'cancelled'.
     */
    public function delete(User $user, Order $order): bool
    {
        return $user->hasRole('admin');
    }
}
