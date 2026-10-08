<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Cart\AddToCartRequest;
use App\Http\Requests\Cart\UpdateCartRequest;
use App\Http\Requests\Cart\RemoveCartRequest;
use App\Services\Cart\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService
    ) {}

    public function add(AddToCartRequest $request): RedirectResponse|JsonResponse
    {
        $productoId = (int) $request->input('producto_id');
        $cantidad = (int) $request->input('cantidad');
        $sessionId = session()->getId();
        Log::info('Cart add', ['user_id'=>auth()->id(), 'producto_id'=>$productoId, 'cantidad'=>$cantidad]);

        $result = $this->cartService->addProducto($productoId, $cantidad, $sessionId, $request->filled('variante_id') ? (int)$request->variante_id : null);
        if ($request->expectsJson()) return $this->jsonResult($result);

        if (!$result['success']) {
            return back()->withErrors(['cart' => $result['message']])->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }

    public function update(UpdateCartRequest $request): RedirectResponse|JsonResponse
    {
        $productoId = (int) $request->input('producto_id');
        $cantidad = (int) $request->input('cantidad');
        $sessionId = session()->getId();
        Log::info('Cart update', ['user_id'=>auth()->id(), 'producto_id'=>$productoId, 'cantidad'=>$cantidad]);

        $result = $this->cartService->updateCantidad($productoId, $cantidad, $sessionId, $request->filled('variante_id') ? (int)$request->variante_id : null);
        if ($request->expectsJson()) return $this->jsonResult($result);

        if (!$result['success']) {
            return back()->withErrors(['cart' => $result['message']])->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }

    public function remove(RemoveCartRequest $request): RedirectResponse|JsonResponse
    {
        $productoId = (int) $request->input('producto_id');
        $sessionId = session()->getId();
        Log::info('Cart remove', ['user_id'=>auth()->id(), 'producto_id'=>$productoId]);

        $result = $this->cartService->removeProducto($productoId, $sessionId, $request->filled('variante_id') ? (int)$request->variante_id : null);
        if ($request->expectsJson()) return $this->jsonResult($result);

        return $result['success'] ? back()->with('success', $result['message']) : back()->withErrors(['cart'=>$result['message']]);
    }

    public function clear(): RedirectResponse|JsonResponse
    {
        $sessionId = session()->getId();
        Log::info('Cart clear', ['user_id'=>auth()->id()]);
        $result = $this->cartService->clearCart($sessionId);
        if (request()->expectsJson()) return $this->jsonResult($result);

        return back()->with('success', $result['message']);
    }
    private function jsonResult(array $result): JsonResponse
    {
        if (!$result['success']) return response()->json(['message'=>$result['message'],'errors'=>['cart'=>[$result['message']]]],422);
        $items=array_values(session('cart',[]));
        return response()->json(['message'=>$result['message'],'cart'=>['items'=>$items,'count'=>array_sum(array_column($items,'cantidad')),'total'=>round(array_reduce($items,fn($sum,$item)=>$sum+$item['precio']*$item['cantidad'],0),2)]]);
    }
}
