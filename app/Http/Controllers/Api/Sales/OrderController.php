<?php

namespace App\Http\Controllers\Api\Sales;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Domain\Sales\Services\OrderService;
use App\Domain\Sales\Repositories\OrderRepositoryInterface;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * List all orders (admin purpose).
     */
    public function index()
    {
        $orders = $this->orderService->orderRepo->all();
        return response()->json($orders);
    }

    /**
     * Create a new order.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string',
            'items'   => 'required|array|min:1',
            'items.*.product_id' => 'required|integer',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $order = $this->orderService->createOrder($validator->validated());
        return response()->json($order, 201);
    }

    /**
     * Show a specific order.
     */
    public function show(string $id)
    {
        $order = $this->orderService->orderRepo->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }
        return response()->json($order);
    }

    /**
     * Update order status.
     */
    public function update(Request $request, string $id)
    {
        $order = $this->orderService->orderRepo->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }
        $validator = Validator::make($request->all(), [
            'status' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $this->orderService->changeStatus($order, $validator->validated()['status']);
        return response()->json($order);
    }

    /**
     * Delete an order.
     */
    public function destroy(string $id)
    {
        $order = $this->orderService->orderRepo->find($id);
        if ($order) {
            $this->orderService->orderRepo->delete($order);
        }
        return response()->json(null, 204);
    }
}
