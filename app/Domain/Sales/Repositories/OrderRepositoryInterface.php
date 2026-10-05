<?php
namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Entities\Order;
use Illuminate\Support\Collection;

/**
 * Interface para el repositorio de pedidos.
 */
interface OrderRepositoryInterface
{
    /**
     * Obtiene un pedido por su ID.
     */
    public function find(string $id): ?Order;

    /**
     * Crea un nuevo pedido.
     */
    public function create(array $attributes): Order;

    /**
     * Actualiza un pedido existente.
     */
    public function update(Order $order, array $attributes): bool;

    /**
     * Elimina un pedido.
     */
    public function delete(Order $order): bool;

    /**
     * Lista los pedidos de un usuario.
     */
    public function findByUserId(string $userId): Collection;
}
