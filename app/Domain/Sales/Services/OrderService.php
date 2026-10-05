<?php
namespace App\Domain\Sales\Services;

use App\Domain\Sales\Repositories\OrderRepositoryInterface;
use App\Domain\Sales\Repositories\OrderItemRepositoryInterface;
use App\Domain\Sales\Entities\Order;
use App\Domain\Sales\Entities\OrderItem;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de negocio para gestionar pedidos.
 *
 * - Crea pedidos a partir del carrito.
 * - Calcula totales con impuestos y descuentos.
 * - Cambia estados y dispara eventos.
 */
class OrderService
{
    protected OrderRepositoryInterface $orderRepo;
    protected OrderItemRepositoryInterface $orderItemRepo;

    public function __construct(
        OrderRepositoryInterface $orderRepo,
        OrderItemRepositoryInterface $orderItemRepo
    ) {
        $this->orderRepo = $orderRepo;
        $this->orderItemRepo = $orderItemRepo;
    }

    /**
     * Crear un nuevo pedido a partir de los datos validados.
     */
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            // Crear pedido base
            $order = $this->orderRepo->create([
                'user_id' => $data['user_id'],
                'status' => 'pending',
                'total_amount' => 0, // se actualizará después
            ]);

            $total = 0;
            foreach ($data['items'] as $item) {
                $orderItem = $this->orderItemRepo->create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
                $total += $item['quantity'] * $item['unit_price'];
            }

            // actualizar total
            $order->total_amount = $total;
            $order->save();

            // TODO: dispatch OrderPlaced event
            return $order;
        });
    }

    /**
     * Cambiar el estado de un pedido.
     */
    public function changeStatus(Order $order, string $status): bool
    {
        $order->status = $status;
        $saved = $order->save();
        // TODO: dispatch events según nuevo estado (e.g., OrderPaid)
        return $saved;
    }

    /**
     * Obtener los pedidos de un usuario.
     */
    public function getUserOrders(string $userId): Collection
    {
        return $this->orderRepo->findByUserId($userId);
    }
}
