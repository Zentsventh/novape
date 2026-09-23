<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\ReservaStock;
use App\Services\Checkout\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkoutService
    ) {}

    public function checkout()
    {
        $cart = session('cart', []);
        $monto = array_reduce($cart, fn($carry, $item) => $carry + ($item['precio'] * $item['cantidad']), 0);

        if ($monto <= 0) {
            return redirect('/')->with('error', 'El carrito está vacío.');
        }

        $loyaltyPoints = auth()->check() ? auth()->user()->loyalty_points : 0;

        return Inertia::render('Checkout', [
            'cart' => array_values($cart),
            'montoTotal' => $monto,
            'loyaltyPoints' => $loyaltyPoints,
        ]);
    }

    public function applyCoupon(Request $request): JsonResponse
    {
        $codigo = $request->input('codigo');
        if (!$codigo) {
            return response()->json(['error' => 'Código no proporcionado'], 400);
        }

        try {
            $cart = session()->get('cart', []);
            $checkoutData = $this->checkoutService->validateAndCalculateTotal($cart, $codigo, 0);
            
            $cupon = \App\Models\Cupon::find($checkoutData['couponId']);
            if (!$cupon) {
                return response()->json(['error' => 'Cupón inválido o inactivo.'], 400);
            }

            return response()->json([
                'id' => $cupon->id,
                'codigo' => $cupon->codigo,
                'tipo' => $cupon->tipo,
                'valor' => $cupon->valor,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
