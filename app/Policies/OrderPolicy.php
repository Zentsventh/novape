<?php

namespace App\Policies;

use App\Domain\Sales\Entities\Order;
use App\Models\Usuario;

/**
 * Política de autorización para pedidos.
 */
class OrderPolicy
{
    /**
     * Determina si el usuario puede ver el pedido.
     */
    public function view(Usuario $user, Order $order): bool
    {
        // Los administradores pueden ver cualquier pedido, los usuarios sólo los suyos.
        return $user->estado === 'activo' && ($user->tienePermiso('ver_pedidos') || $order->user_id == $user->id);
    }

    /**
     * Determina si el usuario puede crear un pedido.
     */
    public function create(Usuario $user): bool
    {
        return $user->estado === 'activo';
    }

    /**
     * Determina si el usuario puede actualizar el estado del pedido.
     */
    public function update(Usuario $user, Order $order): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('editar_pedido');
    }

    /**
     * Determina si el usuario puede cancelar (eliminar) el pedido.
     * En vez de eliminar físicamente, se usará el estado 'cancelled'.
     */
    public function delete(Usuario $user, Order $order): bool
    {
        return $user->estado === 'activo' && $user->esAdmin();
    }
}
