<?php

namespace App\Http\Controllers\Api\Sales;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domain\Sales\Services\CartService;
use App\Domain\Sales\Repositories\CartRepositoryInterface;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    protected CartService $cartService;

    public function __construct(CartService $cartService)
    {
        $this->cartService = $cartService;
    }

    /**
     * List all carts (admin purpose).
     */
    public function index()
    {
        $carts = $this->cartService->cartRepo->all();
        return response()->json($carts);
    }

    /**
     * Add an item to a cart (creates cart if not exists).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id'   => 'required|string',
            'product_id'=> 'required|integer',
            'quantity'  => 'required|integer|min:1',
            'unit_price'=> 'required|numeric|min:0',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $cart = $this->cartService->cartRepo->findByUserId($data['user_id']) ?? $this->cartService->cartRepo->create(['user_id' => $data['user_id']]);
        $this->cartService->addItem($cart, $data['product_id'], $data['quantity'], $data['unit_price']);
        return response()->json($cart->load('items'), 201);
    }

    /**
     * Show a specific cart with its items.
     */
    public function show(string $id)
    {
        $cart = $this->cartService->cartRepo->find($id);
        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }
        return response()->json($cart->load('items'));
    }

    /**
     * Checkout a cart and create an order.
     */
    public function update(Request $request, string $id)
    {
        $cart = $this->cartService->cartRepo->find($id);
        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $order = $this->cartService->checkout($cart, $validator->validated()['user_id']);
        return response()->json($order, 201);
    }

    /**
     * Delete a cart.
     */
    public function destroy(string $id)
    {
        $cart = $this->cartService->cartRepo->find($id);
        if ($cart) {
            $this->cartService->cartRepo->delete($cart);
        }
        return response()->json(null, 204);
    }
}
