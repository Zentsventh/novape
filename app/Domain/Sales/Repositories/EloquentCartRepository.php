<?php
namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Entities\Cart;
use Illuminate\Support\Collection;

/**
 * Implementación Eloquent del repositorio de Cart.
 */
class EloquentCartRepository implements CartRepositoryInterface
{
    public function find(string $id): ?Cart
    {
        return Cart::find($id);
    }

    public function create(array $attributes): Cart
    {
        return Cart::create($attributes);
    }

    public function update(Cart $cart, array $attributes): bool
    {
        return $cart->update($attributes);
    }

    public function delete(Cart $cart): bool
    {
        return $cart->delete();
    }

    public function findByUserId(string $userId): ?Cart
    {
        return Cart::where('user_id', $userId)->first();
    }

    public function all(): Collection
    {
        return Cart::all();
    }
}
