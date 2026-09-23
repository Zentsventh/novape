<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Pedido;
use Illuminate\Support\Str;

class NiubizController extends Controller
{
    private $baseUrl;
    private $merchantId;
    private $user;
    private $password;

    public function __construct()
    {
        $env = config('services.niubiz.env', 'sandbox');
        $this->baseUrl = $env === 'production' 
            ? 'https://apiprod.vnforapps.com' 
            : 'https://apitestenv.vnforapps.com';

        $this->merchantId = config('services.niubiz.merchant_id');
        $this->user = config('services.niubiz.user');
        $this->password = config('services.niubiz.password');
    }

    /**
     * Paso 1: Generar Token de Seguridad
     */
    private function generateToken()
    {
        $response = Http::withBasicAuth($this->user, $this->password)
            ->withOptions(['verify' => false]) // Para desarrollo local (Windows)
            ->get("{$this->baseUrl}/api.security/v1/security");

        if ($response->successful()) {
            return $response->body(); // El token viene como raw string
        }

        throw new \Exception("Error al generar Token de Niubiz: " . $response->body());
    }

    /**
     * Paso 2: Generar Sesión para el Formulario
     */
    public function createSession(Request $request)
    {
        try {
            $user = auth()->user();
            $items = session('cart', []);
            
            // Calcular total a cobrar
            $montoTotal = 0;
            foreach ($items as $item) {
                $montoTotal += $item['precio'] * $item['cantidad'];
            }
            
            // Sumar envío si existe
            $deliveryType = $request->input('deliveryType', 'store');
            $costoEnvio = 0;
            if ($deliveryType === 'home') {
                $costoEnvio = floatval($request->input('shippingCost', 0));
                $montoTotal += $costoEnvio;
            }

            // Validar mínimo
            if ($montoTotal <= 0) {
                return response()->json(['error' => 'El carrito está vacío o el monto es 0'], 400);
            }

            // Generar Token de Seguridad
            $securityToken = $this->generateToken();

            // Generar número de compra único para Niubiz (solo permite números, max 9 digitos usualmente, o podemos usar el ID del pedido)
            // Para prevenir colisiones en pruebas, usamos un timestamp recortado
            $purchaseNumber = substr(time(), -9);

            // Crear la Sesión
            $response = Http::withHeaders(['Authorization' => $securityToken])
                ->withOptions(['verify' => false])
                ->post("{$this->baseUrl}/api.ecommerce/v2/ecommerce/token/session/{$this->merchantId}", [
                    'channel' => 'web',
                    'amount' => round($montoTotal, 2),
                    'antifraud' => [
                        'clientIp' => '190.10.20.30', // IP Publica ficticia para evitar bloqueo de CyberSource por localhost
                        'merchantDefineData' => [
                            'MDD4' => $user->email ?? 'guest@novape.pe',
                            'MDD21' => 'Lima',
                            'MDD32' => 'DNI',
                            'MDD75' => 'Invitado',
                            'MDD77' => '1'
                        ]
                    ]
                ]);

            if (!$response->successful()) {
                throw new \Exception("Error al crear Sesión de Niubiz: " . $response->body());
            }

            $sessionData = $response->json();

            // Guardar datos en sesión de Laravel para validar en la autorización
            session(['niubiz_amount' => round($montoTotal, 2)]);
            session(['niubiz_purchaseNumber' => $purchaseNumber]);

            return response()->json([
                'sessionKey' => $sessionData['sessionKey'],
                'merchantId' => $this->merchantId,
                'purchaseNumber' => $purchaseNumber,
                'amount' => round($montoTotal, 2)
            ]);

        } catch (\Exception $e) {
            Log::error('Niubiz Session Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error de conexión con la pasarela.'], 500);
        }
    }

    /**
     * Paso 3: Autorizar la Transacción
     */
    public function authorizeTransaction(Request $request)
    {
        try {
            $transactionToken = $request->input('transactionToken');
            
            // Recuperar datos seguros de la sesión en lugar de confiar en el request
            $amount = session('niubiz_amount');
            $purchaseNumber = session('niubiz_purchaseNumber');

            if (!$amount || !$purchaseNumber) {
                return redirect()->route('checkout')->with('error', 'Sesión de pago expirada o inválida.');
            }

            // Generar Token de Seguridad nuevamente (para validar)
            $securityToken = $this->generateToken();

            // Autorizar el pago
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
            
            // LOG DE LA RESPUESTA PARA DIAGNOSTICO
            Log::info('Niubiz Auth Response: ', (array) $authData);

            // AquÃ­ deberÃ­as crear tu Pedido real en tu Base de Datos
            // En un flujo real, buscarías el carrito actual y crearías la orden
            
            if (isset($authData['dataMap']['ACTION_CODE']) && $authData['dataMap']['ACTION_CODE'] === '000') {
                // Pago exitoso
                return redirect()->route('checkout.niubiz.success')->with('success', 'Pago aprobado correctamente.');
            } else {
                // Pago denegado o error
                $errorMessage = $authData['dataMap']['ACTION_DESCRIPTION'] ?? 'Transacción rechazada';
                return redirect()->route('checkout')->with('error', 'Pago Denegado: ' . $errorMessage);
            }

        } catch (\Exception $e) {
            Log::error('Niubiz Auth Error: ' . $e->getMessage());
            return redirect()->route('checkout')->with('error', 'Ocurrió un error al procesar el pago.');
        }
    }

    /**
     * Página de Éxito
     */
    public function success()
    {
        return inertia('CheckoutSuccess', [
            'orderId' => 'NUEVA-ORDEN'
        ]);
    }
}
