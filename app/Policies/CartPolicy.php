<?php

namespace App\Policies;

use App\Domain\Sales\Entities\Cart;
use App\Models\Usuario;

/**
 * Política de autorización para el carrito.
 */
class CartPolicy
{
    public function view(Usuario $user, Cart $cart): bool
    {
        return $user->estado === 'activo' && ($user->esAdmin() || $cart->user_id == $user->id);
    }

    public function create(Usuario $user): bool
    {
        return $user->estado === 'activo';
    }

    public function update(Usuario $user, Cart $cart): bool
    {
        return $user->estado === 'activo' && ($user->esAdmin() || $cart->user_id == $user->id);
    }

    public function delete(Usuario $user, Cart $cart): bool
    {
        return $user->estado === 'activo' && $user->esAdmin();
    }
}
