<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Pedido;
use Illuminate\Support\Str;
use App\Services\Checkout\CheckoutService;

class NiubizController extends Controller
{
    private $baseUrl;
    private $merchantId;
    private $user;
    private $password;
    private $checkoutService;

    public function __construct(CheckoutService $checkoutService)
    {
        $this->checkoutService = $checkoutService;
        $env = config('services.niubiz.env', 'sandbox');
        $this->baseUrl = $env === 'production' 
            ? 'https://apiprod.vnforapps.com' 
            : 'https://apisandbox.vnforappstest.com';

        $this->merchantId = config('services.niubiz.merchant_id');
        $this->user = config('services.niubiz.user');
        $this->password = config('services.niubiz.password');
    }

    private function generateToken()
    {
        $response = Http::withBasicAuth($this->user, $this->password)
            ->withOptions(['verify' => false])
            ->get("{$this->baseUrl}/api.security/v1/security");

        if ($response->successful()) {
            return $response->body(); 
        }

        throw new \Exception("Error al generar Token de Niubiz: " . $response->body());
    }

    public function createSession(Request $request)
    {
        try {
            $user = auth()->user();
            $items = session('cart', []);
            
            $couponCode = $request->input('coupon', null);
            $shippingCost = (float) $request->input('shippingCost', 0);
            $usePoints = filter_var($request->input('usePoints', false), FILTER_VALIDATE_BOOLEAN);
            
            // Usar CheckoutService para calcular total exacto aplicando descuentos
            $checkoutData = $this->checkoutService->validateAndCalculateTotal($items, $couponCode, $shippingCost, $usePoints);
            $montoTotal = $checkoutData['totalConDescuento'];

            // Preparar datos para crear el pedido pendiente
            $facturacion = $request->input('facturacion', []);
            $shippingAddress = $request->input('shippingAddress', []);
            
            $tipoComprobante = $facturacion['comprobante'] ?? 'Boleta';
            $documentoCliente = $tipoComprobante === 'Factura' ? ($facturacion['ruc'] ?? null) : ($facturacion['dni'] ?? null);
            $nombreFacturacion = $tipoComprobante === 'Factura' ? ($facturacion['razonSocial'] ?? null) : ($facturacion['nombres'] ?? null);
            $direccionFacturacion = $tipoComprobante === 'Factura' ? ($facturacion['direccionFiscal'] ?? null) : ($shippingAddress['direccion'] ?? null);

            // Crear el pedido Pendiente en BD
            $pedido = $this->checkoutService->createPendingOrder(
                $checkoutData,
                $shippingAddress,
                $documentoCliente,
                $nombreFacturacion,
                $direccionFacturacion,
                $tipoComprobante,
                $shippingCost
            );

            // Reservar Stock para esta sesión
            $sessionId = session()->getId();
            $this->checkoutService->reserveStock($items, $sessionId);

            // Generar Token de Seguridad Niubiz
            $securityToken = $this->generateToken();

            // Número de compra: max 9-12 dígitos
            $purchaseNumber = substr(preg_replace('/[^0-9]/', '', $pedido->codigo) . time(), -9);

            // Crear la Sesión
            $response = Http::withHeaders(['Authorization' => $securityToken])
                ->withOptions(['verify' => false])
                ->post("{$this->baseUrl}/api.ecommerce/v2/ecommerce/token/session/{$this->merchantId}", [
                    'channel' => 'web',
                    'amount' => (float) round($montoTotal, 2),
                    'antifraud' => [
                        'clientIp' => $request->ip() === '127.0.0.1' ? '190.10.20.30' : $request->ip(),
                        'merchantDefineData' => [
                            'MDD4' => $user->email ?? 'guest@novape.pe',
                            'MDD21' => 'Lima',
                            'MDD32' => 'DNI',
                            'MDD75' => $user ? 'Registrado' : 'Invitado',
                            'MDD77' => '1'
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                throw new \Exception("Error al crear Sesión de Niubiz: " . $response->body());
            }

            $sessionData = $response->json();

            // Guardar datos en sesión
            session(['niubiz_amount' => (float) round($montoTotal, 2)]);
            session(['niubiz_purchaseNumber' => $purchaseNumber]);

            return response()->json([
                'sessionKey' => $sessionData['sessionKey'],
                'merchantId' => $this->merchantId,
                'purchaseNumber' => $purchaseNumber,
                'amount' => (float) round($montoTotal, 2),
                'env' => config('services.niubiz.env', 'sandbox')
            ]);

        } catch (\Exception $e) {
            Log::error('Niubiz Session Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function authorizeTransaction(Request $request)
    {
        try {
            $transactionToken = $request->input('transactionToken');
            
            $amount = session('niubiz_amount');
            $purchaseNumber = session('niubiz_purchaseNumber');
            $codigoPedido = session('checkout_pedido');

            if (!$amount || !$purchaseNumber || !$codigoPedido) {
                return redirect()->route('checkout')->with('error', 'Sesión de pago expirada o inválida.');
            }

            $securityToken = $this->generateToken();

            $response = Http::withHeaders(['Authorization' => $securityToken])
                ->withOptions(['verify' => false])
                ->post("{$this->baseUrl}/api.authorization/v3/authorization/ecommerce/{$this->merchantId}", [
                    'channel' => 'web',
                    'captureType' => 'manual',
                    'countable' => true,
                    'order' => [
                        'tokenId' => $transactionToken,
                        'purchaseNumber' => $purchaseNumber,
                        'amount' => $amount,
                        'currency' => 'PEN'
                    ]
                ]);

            $authData = $response->json();
            Log::info('Niubiz Auth Response: ', (array) $authData);
            
            if (isset($authData['dataMap']['ACTION_CODE']) && $authData['dataMap']['ACTION_CODE'] === '000') {
                $this->checkoutService->processSuccessfulPayment($codigoPedido, $amount, $transactionToken, 'niubiz');
                
                $correoDestino = auth()->check() ? auth()->user()->email : ($request->input('customerEmail') ?? null);
                $this->checkoutService->finalizeSuccessAction($codigoPedido, $correoDestino);
                
                session()->forget(['cart', 'checkout_pedido', 'niubiz_amount', 'niubiz_purchaseNumber', 'checkout_cupon_id', 'checkout_monto']);

                return redirect()->route('checkout.niubiz.success')->with('success', 'Pago aprobado correctamente.');
            } else {
                $errorMessage = $authData['dataMap']['ACTION_DESCRIPTION'] ?? 'Transacción rechazada';
                
                $pedidoId = Pedido::where('codigo', $codigoPedido)->value('id');
                if ($pedidoId) {
                    \App\Models\TransaccionPago::create([
                        'pedido_id' => $pedidoId,
                        'payment_intent_id' => $transactionToken,
                        'pasarela' => 'niubiz',
                        'monto' => $amount,
                        'estado' => 'fallido',
                        'error_message' => $errorMessage
                    ]);
                }

                return redirect()->route('checkout')->with('error', 'Pago Denegado: ' . $errorMessage);
            }

        } catch (\Exception $e) {
            Log::error('Niubiz Auth Error: ' . $e->getMessage());
            return redirect()->route('checkout')->with('error', 'Ocurrió un error al procesar el pago: ' . $e->getMessage());
        }
    }

    public function success()
    {
        return inertia('CheckoutSuccess', [
            'orderId' => session('success') ? 'COMPLETADA' : 'NUEVA-ORDEN'
        ]);
    }
}

