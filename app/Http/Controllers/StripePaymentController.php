<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Checkout\ProcessStripePaymentRequest;
use App\Models\Pedido;
use App\Models\ReservaStock;
use App\Services\Checkout\CheckoutService;
use App\Services\Payment\StripePaymentGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class StripePaymentController extends Controller
{
    public function __construct(
        private readonly CheckoutService $checkoutService,
        private readonly StripePaymentGateway $paymentGateway
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

    public function createIntent(ProcessStripePaymentRequest $request): JsonResponse
    {
        try {
            $cart = session('cart', []);
            $couponCode = $request->input('coupon');
            $usePoints = $request->boolean('usePoints', false);
            $shippingCost = (float) $request->input('shippingCost', 0);
            
            $deliveryType = $request->input('deliveryType', '');
            $distrito = $request->input('distrito', '');
            if ($deliveryType === 'domicilio' && $distrito) {
                $shippingCost = (float) \App\Models\ConfiguracionSitio::obtener('envio_tarifa_plana', 15);
            }

            $checkoutData = $this->checkoutService->validateAndCalculateTotal($cart, $couponCode, $shippingCost, $usePoints);
            session(['cart' => $checkoutData['cart']]);

            $this->checkoutService->reserveStock($checkoutData['cart'], session()->getId());

            $tipoComprobante = $request->input('facturacion.comprobante', 'Boleta');
            $documentoCliente = $request->input('facturacion.dni') ?: $request->input('facturacion.ruc');
            $nombreFacturacion = $tipoComprobante === 'Factura' ? $request->input('facturacion.razonSocial') : $request->input('facturacion.nombres');
            $direccionFacturacion = $request->input('facturacion.direccionFiscal');
            $shippingAddress = $request->input('shippingAddress', []);

            $pedido = $this->checkoutService->createPendingOrder(
                $checkoutData, 
                $shippingAddress, 
                $documentoCliente, 
                $nombreFacturacion, 
                $direccionFacturacion, 
                $tipoComprobante, 
                $shippingCost
            );

            session([
                'checkout_email' => $request->input('email'),
                'checkout_facturacion' => $request->input('facturacion'),
            ]);

            $paymentIntent = $this->paymentGateway->createPaymentIntent(
                $checkoutData['totalConDescuento'],
                'pen',
                [
                    'codigo_pedido' => $pedido->codigo,
                    'user_id' => auth()->id() ?? 'guest',
                    'email' => $request->input('email') ?? (auth()->user() ? auth()->user()->email : ''),
                ]
            );

            return response()->json([
                'clientSecret' => $paymentIntent->client_secret,
                'codigoPedido' => $pedido->codigo,
                'monto' => $checkoutData['totalConDescuento'],
            ]);

        } catch (\Exception $e) {
            Log::error('Error en Checkout: '.$e->getMessage());
            return response()->json(['error' => $e->getMessage()], $e->getCode() === 400 ? 400 : 500);
        }
    }

    public function webhook(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');
        if (!$secret) {
            return response('Server Configuration Error', 500);
        }

        try {
            if (app()->environment('testing')) {
                $event = json_decode(json_encode($request->all()));
            } else {
                $payload = @file_get_contents('php://input');
                $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
                $event = $this->paymentGateway->verifyWebhookSignature($payload, $signature, $secret);
            }

            if ($event->type == 'payment_intent.succeeded') {
                $paymentIntent = $event->data->object;
                $paymentIntentArray = json_decode(json_encode($paymentIntent), true);
                \App\Jobs\ProcessStripeWebhookJob::dispatch($paymentIntentArray);
            }

            return response('Webhook Handled', 200);

        } catch (\Exception $e) {
            Log::error('Webhook Stripe: '.$e->getMessage());
            return response($e->getMessage(), 400);
        }
    }

    public function success(Request $request)
    {
        $paymentIntentId = $request->query('payment_intent');
        $codigoPedido = session('checkout_pedido');
        $pedido = Pedido::where('codigo', $codigoPedido)->first();

        if ($pedido && $pedido->estado === 'Pendiente') {
            try {
                $intent = $this->paymentGateway->retrievePaymentIntent($paymentIntentId);
                if ($intent->status !== 'succeeded') {
                    return redirect('/checkout')->with('error', 'El pago no ha sido completado exitosamente.');
                }
                if (abs(($intent->amount / 100) - $pedido->total) > 0.01) {
                    return redirect('/checkout')->with('error', 'El monto pagado no coincide.');
                }

                $changed = $this->checkoutService->processSuccessfulPayment($codigoPedido, $intent->amount / 100);
                if ($changed) {
                    ReservaStock::where('session_id', session()->getId())->delete();
                    $this->checkoutService->finalizeSuccessAction($codigoPedido, session('checkout_email'));
                }
            } catch (\Exception $e) {
                Log::error('Error validando success: '.$e->getMessage());
                return redirect('/checkout')->with('error', 'Error al verificar el pago.');
            }
        }

        session()->forget(['cart', 'checkout_monto', 'checkout_pedido', 'checkout_cupon_id', 'checkout_email']);

        $usuario = auth()->user();
        if ($usuario && $usuario->carrito) {
            $usuario->carrito->items()->delete();
        }

        return Inertia::render('CheckoutSuccess', [
            'pedido' => $codigoPedido,
            'paymentIntentId' => $paymentIntentId,
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
