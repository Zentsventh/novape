<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Cart\AddToCartRequest;
use App\Http\Requests\Cart\UpdateCartRequest;
use App\Http\Requests\Cart\RemoveCartRequest;
use App\Services\Cart\CartService;
use Illuminate\Http\RedirectResponse;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $cartService
    ) {}

    public function add(AddToCartRequest $request): RedirectResponse
    {
        $productoId = (int) $request->input('producto_id');
        $cantidad = (int) $request->input('cantidad');
        $sessionId = session()->getId();

        $result = $this->cartService->addProducto($productoId, $cantidad, $sessionId);

        if (!$result['success']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }

    public function update(UpdateCartRequest $request): RedirectResponse
    {
        $productoId = (int) $request->input('producto_id');
        $cantidad = (int) $request->input('cantidad');
        $sessionId = session()->getId();

        $result = $this->cartService->updateCantidad($productoId, $cantidad, $sessionId);

        if (!$result['success']) {
            return back()->with('error', $result['message']);
        }

        return back()->with('success', $result['message']);
    }

    public function remove(RemoveCartRequest $request): RedirectResponse
    {
        $productoId = (int) $request->input('producto_id');
        $sessionId = session()->getId();

        $result = $this->cartService->removeProducto($productoId, $sessionId);

        return back()->with('success', $result['message']);
    }

    public function clear(): RedirectResponse
    {
        $sessionId = session()->getId();
        $result = $this->cartService->clearCart($sessionId);

        return back()->with('success', $result['message']);
    }
}
