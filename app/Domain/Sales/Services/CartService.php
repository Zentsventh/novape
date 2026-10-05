<?php
namespace App\Domain\Sales\Services;

use App\Domain\Sales\Repositories\CartRepositoryInterface;
use App\Domain\Sales\Repositories\OrderRepositoryInterface;
use App\Domain\Sales\Repositories\OrderItemRepositoryInterface;
use App\Domain\Sales\Entities\Cart;
use App\Domain\Sales\Entities\Order;
use App\Domain\Sales\Entities\OrderItem;
use Illuminate\Support\Facades\DB;

/**
 * Servicio para gestionar el carrito y su transformación en pedido.
 */
class CartService
{
    protected CartRepositoryInterface $cartRepo;
    protected OrderRepositoryInterface $orderRepo;
    protected OrderItemRepositoryInterface $orderItemRepo;

    public function __construct(
        CartRepositoryInterface $cartRepo,
        OrderRepositoryInterface $orderRepo,
        OrderItemRepositoryInterface $orderItemRepo
    ) {
        $this->cartRepo = $cartRepo;
        $this->orderRepo = $orderRepo;
        $this->orderItemRepo = $orderItemRepo;
    }

    /**
     * Añadir o actualizar un producto en el carrito.
     */
    public function addItem(Cart $cart, int $productId, int $quantity, float $unitPrice): void
    {
        $existing = $cart->items()->where('product_id', $productId)->first();
        if ($existing) {
            $existing->quantity += $quantity;
            $existing->unit_price = $unitPrice; // actualizar precio si cambia
            $existing->save();
        } else {
            $cart->items()->create([
                'product_id' => $productId,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
            ]);
        }
    }

    /**
     * Convertir el carrito en un pedido.
     */
    public function checkout(Cart $cart, int $userId): Order
    {
        return DB::transaction(function () use ($cart, $userId) {
            $order = $this->orderRepo->create([
                'user_id' => $userId,
                'status' => 'pending',
                'total_amount' => 0,
            ]);

            $total = 0;
            foreach ($cart->items as $cartItem) {
                $orderItem = $this->orderItemRepo->create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem->product_id,
                    'quantity' => $cartItem->quantity,
                    'unit_price' => $cartItem->unit_price,
                ]);
                $total += $cartItem->quantity * $cartItem->unit_price;
            }

            $order->total_amount = $total;
            $order->save();

            // limpiar carrito
            $cart->items()->delete();
            $cart->delete();

            // TODO: dispatch OrderPlaced event
            return $order;
        });
    }
}
