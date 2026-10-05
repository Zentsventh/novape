<?php
namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Entities\Cart;
use Illuminate\Support\Collection;

/**
 * Interface for Cart repository.
 */
interface CartRepositoryInterface
{
    public function find(string $id): ?Cart;
    public function create(array $attributes): Cart;
    public function update(Cart $cart, array $attributes): bool;
    public function delete(Cart $cart): bool;
    /**
     * Find cart by user ID (one active cart per user).
     */
    public function findByUserId(string $userId): ?Cart;
    /**
     * Retrieve all carts (admin purpose).
     */
    public function all(): Collection;
}
