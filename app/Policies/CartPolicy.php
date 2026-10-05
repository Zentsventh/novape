<?php
namespace App\Policies;

use App\Models\User;
use App\Domain\Sales\Entities\Cart;

/**
 * Política de autorización para el carrito.
 */
class CartPolicy
{
    public function view(User $user, Cart $cart): bool
    {
        return $user->hasRole('admin') || $cart->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('sales.cart.create');
    }

    public function update(User $user, Cart $cart): bool
    {
        return $user->hasRole('admin') || $cart->user_id === $user->id;
    }

    public function delete(User $user, Cart $cart): bool
    {
        return $user->hasRole('admin');
    }
}
