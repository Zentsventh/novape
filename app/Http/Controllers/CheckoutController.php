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
        if ($completed = app(\App\Services\Checkout\CheckoutCompletion::class)->recover()) {
            return $completed;
        }
        Log::info('Checkout accessed', ['user_id' => auth()->id(), 'item_count' => count(session('cart', []))]);
    
        $cart = session('cart', []);
        $monto = array_reduce($cart, fn($carry, $item) => $carry + ($item['precio'] * $item['cantidad']), 0);

        if (empty($cart)) {
            return redirect('/')->with('error', 'El carrito está vacío.');
        }

        try {
            $calculated = $this->checkoutService->validateAndCalculateTotal($cart, null, 0, false, false);
            $cart = $calculated['cart'];
            $monto = $calculated['total'];
            session(['cart' => $cart]);
        } catch (\Exception $exception) {
            return redirect('/carrito')->with('error', $exception->getMessage());
        }

        $loyaltyPoints = auth()->check() ? auth()->user()->loyalty_points : 0;

        return Inertia::render('Checkout', [
            'cart' => array_values($cart),
            'montoTotal' => $monto,
            'loyaltyPoints' => $loyaltyPoints,
            'pickupLocations' => \App\Services\Shipping\PickupService::options(),
            'googleMapsKey' => config('services.google.maps_key'),
            'savedAddress' => auth()->check() ? auth()->user()->direcciones()->orderByDesc('principal')->orderByDesc('id')->first()?->only(['direccion', 'referencia', 'distrito', 'codigo_postal']) : null,
        ]);
    }

    public function applyCoupon(Request $request): JsonResponse
    {
        Log::info('Apply coupon called', ['user_id' => auth()->id(), 'codigo' => $request->input('codigo')]);
        $codigo = $request->input('codigo');
        if (!$codigo) {
            return response()->json(['error' => 'Código no proporcionado'], 400);
        }

        try {
            $cart = session()->get('cart', []);
            $checkoutData = $this->checkoutService->validateAndCalculateTotal($cart, $codigo, 0, false, false);
            
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
