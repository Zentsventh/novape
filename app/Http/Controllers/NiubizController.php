<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\ReservaStock;
use App\Models\TransaccionPago;
use App\Services\Checkout\CheckoutService;
use App\Services\Shipping\ShippingCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class NiubizController extends Controller
{
    private $baseUrl;

    private $merchantId;

    private $user;

    private $password;

    private $checkoutService;

    private ShippingCalculationService $shippingCalculationService;

    public function __construct(CheckoutService $checkoutService, ShippingCalculationService $shippingCalculationService)
    {
        $this->checkoutService = $checkoutService;
        $this->shippingCalculationService = $shippingCalculationService;
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
        $response = Http::connectTimeout(5)->timeout(15)->withBasicAuth($this->user, $this->password)
            ->get("{$this->baseUrl}/api.security/v1/security");

        if ($response->successful()) {
            return $response->body();
        }

        throw new \Exception('Error al generar Token de Niubiz: '.$response->body());
    }

    public function createSession(Request $request)
    {
        $lock = \Illuminate\Support\Facades\Cache::lock('checkout:'.(auth()->id() ? 'user:'.auth()->id() : 'session:'.session()->getId()),60);
        try { return $lock->block(5, fn()=>$this->prepareSession($request)); }
        catch (\Illuminate\Contracts\Cache\LockTimeoutException $error) { return response()->json(['error'=>'Ya estamos preparando esta compra. Espera unos segundos.'],409); }
    }

    private function prepareSession(Request $request)
    {
        try {
            $user = auth()->user();
            $items = session('cart', []);
            $pendingCode = session('checkout_pedido');
            if ($pendingCode && DB::table('payment_reconciliations')->whereIn('status', ['authorizing', 'approved', 'needs_review'])
                ->where('pedido_id', Pedido::where('codigo', $pendingCode)->value('id'))->exists()) {
                return response()->json(['error' => 'Tu pago está en verificación. Contacta a soporte con el código '.$pendingCode.' antes de volver a pagar.'], 409);
            }
            $contactData = $request->validate([
                'email' => ['required', 'email', 'max:254'],
                'facturacion' => ['required', 'array'],
                'facturacion.comprobante' => ['required', 'in:Boleta,Factura'],
                'facturacion.dni' => ['nullable', 'regex:/^[0-9]{8}$/'],
                'facturacion.nombres' => ['nullable', 'string', 'max:255'],
                'facturacion.ruc' => ['required_if:facturacion.comprobante,Factura', 'nullable', 'regex:/^[0-9]{11}$/'],
                'facturacion.razonSocial' => ['required_if:facturacion.comprobante,Factura', 'nullable', 'string', 'max:255'],
                'facturacion.direccionFiscal' => ['required_if:facturacion.comprobante,Factura', 'nullable', 'string', 'max:255'],
                'shippingAddress.nombres' => ['required', 'string', 'max:100'],
                'shippingAddress.apellidos' => ['required', 'string', 'max:100'],
                'shippingAddress.celular' => ['required', 'regex:/^\+?[0-9\s-]{7,20}$/'],
                'shippingAddress.doc' => ['required', 'string', 'max:20'],
                'shippingAddress.tipoDoc' => ['nullable', 'in:DNI,CE,PASAPORTE'],
                'shippingAddress.referencia' => ['nullable', 'string', 'max:255'],
                'shippingAddress.tipo' => ['nullable', 'string', 'max:50'],
                'shippingAddress.codigo_postal' => ['nullable', 'regex:/^[0-9]{5}$/'],
                'shippingAddress.guardarDireccion' => ['nullable', 'boolean'],
                'shippingAddress.pickup_location_id' => ['required_if:deliveryType,tienda', 'nullable', 'integer'],
                'usePoints' => ['nullable', 'boolean'],
                'coupon' => ['nullable', 'string', 'max:100'],
            ]);

            $couponCode = $request->input('coupon', null);
            $shippingAddress = $request->validate([
                'deliveryType' => ['required', 'in:domicilio,tienda'],
                'shippingAddress' => ['required', 'array'],
                'shippingAddress.direccion' => ['required_if:deliveryType,domicilio', 'nullable', 'string', 'max:255'],
                'shippingAddress.distrito' => ['required_if:deliveryType,domicilio', 'nullable', 'string', 'max:100'],
            ])['shippingAddress'];
            // A second validation returns only its own nested keys. Preserve the
            // validated recipient fields used in the order and invoice snapshot.
            $shippingAddress = array_merge($contactData['shippingAddress'], $shippingAddress);
            $deliveryType = $request->input('deliveryType');
            \App\Services\Shipping\PickupService::validateCart($items, $deliveryType);
            $shippingAddress['delivery_type'] = $deliveryType;
            if ($deliveryType === 'tienda') {
                $shippingAddress['pickup'] = \App\Services\Shipping\PickupService::select((int) $shippingAddress['pickup_location_id']);
                $shippingAddress['guardarDireccion'] = false;
            }
            $shippingQuote = $deliveryType === 'tienda' ? ['costo' => 0.0, 'source' => 'pickup', 'courier' => 'Retiro en tienda', 'test' => false] : $this->shippingCalculationService->calculateCost($items, array_merge($shippingAddress, [
                'departamento' => 'LIMA',
                'provincia' => 'LIMA',
                'distrito' => $shippingAddress['distrito'],
            ]));
            $shippingCost = (float) $shippingQuote['costo'];
            $usePoints = filter_var($request->input('usePoints', false), FILTER_VALIDATE_BOOLEAN);

            // Usar CheckoutService para calcular total exacto aplicando descuentos
            $checkoutData = $this->checkoutService->validateAndCalculateTotal($items, $couponCode, $shippingCost, $usePoints);
            $montoTotal = $checkoutData['totalConDescuento'];
            $environment = config('services.niubiz.env', 'sandbox');
            $quoteHash = hash('sha256', json_encode([$checkoutData, $shippingAddress, $request->only(['email', 'facturacion', 'deliveryType']), auth()->id(), $environment, $this->merchantId]));
            if ($unresolved = Pedido::where('usuario_id',auth()->id())->where('checkout_fingerprint',$quoteHash)->whereIn('id',DB::table('payment_reconciliations')->whereIn('status',['authorizing','approved','needs_review'])->select('pedido_id'))->first()) {
                return response()->json(['error'=>'Hay un pago de esta misma compra en verificación. Revisa el pedido '.$unresolved->codigo.' antes de reintentar.'],409);
            }
            $cachedQuote = session('niubiz_quote');
            // Checkout.js accepts expirationminutes only between 5 and 20.
            $previousAttempt = $cachedQuote ? DB::table('payment_reconciliations')->where('purchase_number', $cachedQuote['data']['purchaseNumber'] ?? '')->first() : null;
            if ($cachedQuote && (!$previousAttempt || $previousAttempt->status === 'prepared') && ($cachedQuote['hash'] ?? null) === $quoteHash && ($cachedQuote['expires'] ?? 0) > time() + 300) {
                return response()->json($cachedQuote['data']);
            }
            $shippingAddress['email'] = $request->input('email');
            $shippingAddress['shipping_quote'] = $shippingQuote;
            session(['checkout_guest_email' => $shippingAddress['email']]);

            $this->checkoutService->reserveStock($items, session()->getId());

            // Preparar datos para crear el pedido pendiente
            $facturacion = $request->input('facturacion', []);
            $tipoComprobante = $facturacion['comprobante'] ?? 'Boleta';
            $documentoCliente = $tipoComprobante === 'Factura' ? ($facturacion['ruc'] ?? null) : (($facturacion['dni'] ?? '') ?: $shippingAddress['doc']);
            $nombreFacturacion = $tipoComprobante === 'Factura' ? ($facturacion['razonSocial'] ?? null) : (($facturacion['nombres'] ?? '') ?: trim($shippingAddress['nombres'].' '.$shippingAddress['apellidos']));
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
            $pedido->update(['checkout_fingerprint'=>$quoteHash]);

            // Generar Token de Seguridad Niubiz
            // Número de compra: max 9-12 dígitos
            $lastNumber = DB::table('payment_reconciliations')->where('pedido_id', $pedido->id)->max('purchase_number');
            $lastAttempt = $lastNumber ? (int) $lastNumber - $pedido->id * 100 : 0;
            $attempt = max((int) session('niubiz_attempt', 0), $lastAttempt) + 1;
            if ($attempt > 99 || $pedido->id > 9999999) {
                throw new \RuntimeException('No se puede generar otro número de compra para este pedido.');
            }
            $purchaseNumber = str_pad((string) ($pedido->id * 100 + $attempt), 9, '0', STR_PAD_LEFT);
            session(['niubiz_attempt' => $attempt]);
            DB::table('payment_reconciliations')->where('pedido_id',$pedido->id)->where('status','prepared')->update(['status'=>'expired','updated_at'=>now()]);
            $preparedId = DB::table('payment_reconciliations')->insertGetId(['purchase_number'=>$purchaseNumber,'pedido_id'=>$pedido->id,
                'amount'=>round($montoTotal,2),'status'=>'preparing','reference_hash'=>hash('sha256', 'prepared:'.$purchaseNumber),
                'quote_hash'=>$quoteHash,'expires_at'=>now()->addMinutes(14),'created_at'=>now(),'updated_at'=>now()]);

            // Crear la Sesión
            $securityToken = $this->generateToken();
            $response = Http::connectTimeout(5)->timeout(15)->withHeaders(['Authorization' => $securityToken])
                ->post("{$this->baseUrl}/api.ecommerce/v2/ecommerce/token/session/{$this->merchantId}", [
                    'channel' => 'web',
                    'amount' => (float) round($montoTotal, 2),
                    'antifraud' => [
                        'clientIp' => $environment === 'sandbox' && $request->ip() === '127.0.0.1' ? '190.10.20.30' : $request->ip(),
                        'merchantDefineData' => [
                            'MDD4' => $request->input('email'),
                            'MDD21' => 'Lima',
                            'MDD32' => 'DNI',
                            'MDD75' => $user ? 'Registrado' : 'Invitado',
                            'MDD77' => '1',
                        ],
                    ],
                ]);

            if (! $response->successful()) {
                throw new \Exception('Error al crear Sesión de Niubiz: '.$response->body());
            }

            $sessionData = $response->json();
            DB::table('payment_reconciliations')->where('id',$preparedId)->update(['status'=>'prepared','updated_at'=>now()]);

            // Guardar datos en sesión
            session(['niubiz_amount' => (float) round($montoTotal, 2)]);
            session(['niubiz_purchaseNumber' => $purchaseNumber]);

            $data = [
                'sessionKey' => $sessionData['sessionKey'],
                'orderAccessUrl'=>\Illuminate\Support\Facades\URL::temporarySignedRoute('store.order.access',now()->addDays(60),['codigo'=>$pedido->codigo]),
                'merchantId' => $this->merchantId,
                'purchaseNumber' => $purchaseNumber,
                'amount' => (float) round($montoTotal, 2),
                'items' => array_values($checkoutData['cart']),
                'summary' => [
                    'subtotal' => (float) $checkoutData['total'],
                    'couponDiscount' => (float) min($checkoutData['total'], max(0, $checkoutData['descuentoMonto'] - $checkoutData['puntosUsados'] / 10)),
                    'pointsDiscount' => (float) ($checkoutData['puntosUsados'] / 10),
                    'shipping' => $shippingCost,
                ],
                'env' => $environment,
                'shipping' => $shippingQuote,
                'callbackUrl' => \Illuminate\Support\Facades\URL::temporarySignedRoute('checkout.niubiz.authorize', now()->addMinutes(15), ['purchase' => $purchaseNumber]),
                'expiresAt' => now()->addMinutes(14)->getTimestampMs(),
            ];
            if ($environment === 'sandbox') {
                $data['testCard'] = config('services.niubiz.test_card');
            }
            session(['niubiz_quote' => ['hash' => $quoteHash, 'expires' => time() + 840, 'data' => $data]]);
            return response()->json($data);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            if (isset($preparedId)) DB::transaction(function () use ($preparedId,$pedido) {
                Pedido::whereKey($pedido->id)->lockForUpdate()->firstOrFail();
                $changed = DB::table('payment_reconciliations')->where('id',$preparedId)->where('status','preparing')->update(['status'=>'session_failed','updated_at'=>now()]);
                $active = DB::table('payment_reconciliations')->where('pedido_id',$pedido->id)->whereIn('status',['preparing','prepared','authorizing','approved','needs_review'])->exists();
                if ($changed && !$active) {
                    ReservaStock::where('session_id',$pedido->checkout_session_id)->delete();
                    DB::table('checkout_benefit_reservations')->where('pedido_id',$pedido->id)->delete();
                    session()->forget('niubiz_quote');
                }
            });
            Log::error('Niubiz Session Error: '.$e->getMessage());

            return response()->json(['error' => 'No se pudo preparar el pago. Revisa los datos e intenta nuevamente.'], 500);
        }
    }

    public function authorizeTransaction(Request $request)
    {
        $attemptId = null;
        try {
            $transactionToken = $request->input('transactionToken');

            $purchaseNumber = (string) $request->query('purchase');
            $persistedAttempt = DB::table('payment_reconciliations')->where('purchase_number',$purchaseNumber)->first();
            $durableOrder = $persistedAttempt ? Pedido::find($persistedAttempt->pedido_id) : null;
            $amount = $persistedAttempt?->amount ?? session('niubiz_amount');
            $codigoPedido = $durableOrder?->codigo ?? session('checkout_pedido');
            if (!$persistedAttempt) abort_unless(hash_equals((string)session('niubiz_purchaseNumber'), $purchaseNumber),403);

            if (! $amount || ! $purchaseNumber || ! $codigoPedido) {
                return redirect()->route('checkout')->with('error', 'Sesión de pago expirada o inválida.');
            }

            if (! is_string($transactionToken) || $transactionToken === '') {
                throw new \InvalidArgumentException('Falta el token de transacción.');
            }
            $order = Pedido::where('codigo', $codigoPedido)->firstOrFail();
            $existing = DB::table('payment_reconciliations')->where('purchase_number', $purchaseNumber)->first();
            if ($existing && $existing->status !== 'prepared') {
                if ($existing->reference_hash !== hash('sha256', $transactionToken) || $existing->pedido_id !== $order->id) {
                    throw new \RuntimeException('La operación no coincide con el intento original.');
                }
                if ($existing->status === 'applied') {
                    return app(\App\Services\Checkout\CheckoutCompletion::class)->complete($order);
                }
                if ($existing->status === 'approved') {
                    $order = app(\App\Services\Checkout\ApprovedPaymentCompletion::class)->apply($existing->id, $transactionToken);
                    return app(\App\Services\Checkout\CheckoutCompletion::class)->complete($order);
                }

                return redirect()->route('checkout')->with('error', 'Este pago está en verificación. No repitas el cobro; contacta a soporte con el código '.$order->codigo.'.');
            }
            if (strtolower($order->estado) !== 'pendiente' || abs((float) $order->total - (float) $amount) > 0.01) {
                throw new \RuntimeException('El pedido ya no está pendiente o su importe cambió. Genera una nueva sesión de pago.');
            }
            if (! DB::table('checkout_benefit_reservations')->where('pedido_id', $order->id)->where('expires_at', '>', now())->exists()) {
                throw new \RuntimeException('La reserva de pago expiró. Genera una nueva sesión antes de cobrar.');
            }
            if ($existing) {
                if (!$existing->expires_at || \Carbon\Carbon::parse($existing->expires_at)->isPast()) throw new \RuntimeException('La sesión de pago expiró antes de autorizar.');
                $claimed = DB::transaction(function () use ($existing,$order,$amount,$transactionToken) {
                    $locked = Pedido::whereKey($order->id)->lockForUpdate()->firstOrFail();
                    if (strtolower($locked->estado) !== 'pendiente' || $locked->checkout_fingerprint !== $existing->quote_hash || abs((float)$locked->total-(float)$amount)>0.01 || !DB::table('checkout_benefit_reservations')->where('pedido_id',$order->id)->where('expires_at','>',now())->exists()) return 0;
                    return DB::table('payment_reconciliations')->where('id',$existing->id)->where('status','prepared')->where('expires_at','>',now())->update(['status'=>'authorizing','reference_hash'=>hash('sha256',$transactionToken),'review_due_at'=>now()->addMinutes(5),'updated_at'=>now()]);
                });
                if (!$claimed) throw new \RuntimeException('Este intento ya está siendo autorizado.');
                $attemptId = $existing->id;
            } else $attemptId = DB::table('payment_reconciliations')->insertGetId([
                'purchase_number' => $purchaseNumber, 'pedido_id' => $order->id, 'amount' => $amount,
                'status' => 'authorizing', 'reference_hash' => hash('sha256', $transactionToken), 'created_at' => now(), 'updated_at' => now(),
            ]);
            $securityToken = $this->generateToken();

            $response = Http::connectTimeout(5)->timeout(15)->withHeaders(['Authorization' => $securityToken])
                ->post("{$this->baseUrl}/api.authorization/v3/authorization/ecommerce/{$this->merchantId}", [
                    'channel' => 'web',
                    'captureType' => 'manual',
                    'countable' => true,
                    'order' => [
                        'tokenId' => $transactionToken,
                        'purchaseNumber' => $purchaseNumber,
                        'amount' => (float) $amount,
                        'currency' => 'PEN',
                    ],
                ]);

            $authData = $response->json();
            Log::info('Niubiz authorization result', ['purchase_number' => $purchaseNumber, 'action_code' => $authData['dataMap']['ACTION_CODE'] ?? null]);

            if ($response->successful() && isset($authData['dataMap']['ACTION_CODE']) && $authData['dataMap']['ACTION_CODE'] === '000') {
                DB::table('payment_reconciliations')->where('id', $attemptId)->update(['status' => 'approved', 'approved_at' => now(), 'updated_at' => now()]);
                $order = app(\App\Services\Checkout\ApprovedPaymentCompletion::class)->apply($attemptId, $transactionToken);

                $correoDestino = $order->direccion_envio_snapshot['email'] ?? session('checkout_guest_email') ?? $order->usuario?->email;
                try {
                    $this->checkoutService->finalizeSuccessAction($codigoPedido, $correoDestino);
                } catch (\Throwable $notificationError) {
                    Log::error('Paid order notification pending', ['order' => $codigoPedido, 'exception' => get_class($notificationError)]);
                }
                return app(\App\Services\Checkout\CheckoutCompletion::class)->complete($order);
            } else {
                $errorMessage = $authData['dataMap']['ACTION_DESCRIPTION'] ?? 'Respuesta de pago no confirmada';
                $confirmedDecline = $response->successful() && isset($authData['dataMap']['ACTION_CODE']) && $authData['dataMap']['ACTION_CODE'] !== '000';
                DB::table('payment_reconciliations')->where('id', $attemptId)->update(['status' => $confirmedDecline ? 'declined' : 'needs_review', 'error' => $errorMessage, 'updated_at' => now()]);

                $pedidoId = Pedido::where('codigo', $codigoPedido)->value('id');
                if ($pedidoId && $confirmedDecline) {
                    TransaccionPago::create([
                        'pedido_id' => $pedidoId,
                        'referencia_pasarela' => $transactionToken,
                        'pasarela' => 'niubiz',
                        'monto' => $amount,
                        'estado' => 'fallido',
                        'error_message' => $errorMessage,
                    ]);
                }

                if ($confirmedDecline) {
                    session()->forget('niubiz_quote');
                    ReservaStock::where('session_id',$order->checkout_session_id)->delete();
                    DB::table('checkout_benefit_reservations')->where('pedido_id',$order->id)->delete();
                }

                return redirect()->route('checkout')->with('error', $confirmedDecline ? 'Pago denegado: '.$errorMessage : 'El pago está en verificación. Contacta a soporte antes de volver a pagar.');
            }

        } catch (\Throwable $e) {
            // A post-commit invoice/notification failure cannot reverse a confirmed payment.
            if ($completed = app(\App\Services\Checkout\CheckoutCompletion::class)->recover()) {
                Log::error('Paid checkout recovered after post-payment failure', ['exception' => get_class($e)]);
                return $completed;
            }
            if ($attemptId) {
                DB::table('payment_reconciliations')->where('id', $attemptId)->where('status', 'authorizing')->update(['status' => 'needs_review', 'error' => mb_substr($e->getMessage(), 0, 1000), 'updated_at' => now()]);
            }
            Log::error('Niubiz Auth Error: '.$e->getMessage());

            return redirect()->route('checkout')->with('error', 'No se pudo confirmar el pago. Si hubo un cargo, contacta a soporte antes de reintentar.');
        }
    }

    public function recoverAuthorization(Request $request)
    {
        $attempt = DB::table('payment_reconciliations')->where('purchase_number', (string) $request->query('purchase'))->first();
        abort_unless($attempt, 404);
        if (!in_array($attempt->status, ['approved','applied'], true)) {
            return redirect()->route('checkout')->with('error', 'Este pago no tiene una confirmación aplicada. Si está en revisión, contacta a soporte antes de volver a pagar.');
        }
        try {
            $order = app(\App\Services\Checkout\ApprovedPaymentCompletion::class)->apply($attempt->id);
            return app(\App\Services\Checkout\CheckoutCompletion::class)->complete($order);
        } catch (\Throwable $error) {
            Log::error('Niubiz approved payment application pending', ['attempt_id'=>$attempt->id,'exception'=>get_class($error)]);
            return redirect()->route('checkout')->with('error', 'Niubiz confirmó el pago, pero el pedido necesita revisión. No vuelvas a pagar; contacta a soporte.');
        }
    }

    public function success(Request $request)
    {
        abort_unless($request->hasValidSignature(), 403);
        $pedido = Pedido::where('codigo', $request->query('pedido'))->first();
        abort_unless($pedido && DB::table('payment_reconciliations')->where('pedido_id', $pedido->id)->where('status', 'applied')->exists(), 404);
        $receipt = app(\App\Services\Orders\PaidInvoiceRegistry::class)->register($pedido);
        return inertia('CheckoutSuccess', [
            'pedido' => $pedido->only(['codigo', 'estado', 'total', 'created_at']),
            'orderAccessUrl' => \Illuminate\Support\Facades\URL::temporarySignedRoute('store.order.access',now()->addDays(60),['codigo'=>$pedido->codigo]),
            'comprobante' => [
                'tipo' => ucfirst($receipt->tipo), 'numero' => $receipt->serie && $receipt->numero ? $receipt->serie.'-'.$receipt->numero : $receipt->codigo_ticket,
                'estado' => $receipt->estado_sunat,
                'downloadUrl' => \Illuminate\Support\Facades\URL::temporarySignedRoute('comprobante.ecommerce.publico', now()->addHours(24), ['codigo' => $pedido->codigo]),
            ],
        ]);
    }
}
