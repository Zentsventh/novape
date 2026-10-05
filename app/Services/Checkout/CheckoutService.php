<?php

declare(strict_types=1);

namespace App\Services\Checkout;

use App\Jobs\ProcessSunatInvoiceJob;
use App\Jobs\SendOrderConfirmationJob;
use App\Jobs\SendWhatsAppNotification;
use App\Models\ConfiguracionSitio;
use App\Models\CrmDeal;
use App\Models\Cupon;
use App\Models\DireccionUsuario;
use App\Models\LoyaltyPointsHistory;
use App\Models\Pago;
use App\Models\Pedido;
use App\Models\ReservaStock;
use App\Models\TransaccionPago;
use App\Models\Usuario;
use App\Models\Variante;
use App\Services\Admin\Crm\CrmPipelineService;
use App\Services\Orders\InvoiceSnapshot;
use App\Services\Orders\OrderTransitions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CheckoutService
{
    public function validateAndCalculateTotal(array $cart, ?string $couponCode, float $shippingCost, bool $usePoints = false): array
    {
        $total = 0;
        foreach ($cart as &$item) {
            if (empty($item['variante_id']) || ! is_numeric($item['cantidad'] ?? null) || (int) $item['cantidad'] < 1) {
                throw new \InvalidArgumentException('El carrito contiene un producto inválido.');
            }
            $variante = Variante::find($item['variante_id']);
            if (! $variante || ! $variante->activo) {
                throw new \InvalidArgumentException('Un producto del carrito ya no está disponible.');
            }
            $item['precio'] = (float) $variante->precio;
            $total += $item['precio'] * (int) $item['cantidad'];
        }
        unset($item);

        if ($total <= 0) {
            throw new \Exception('Carrito vacío');
        }

        $descuentoMonto = 0;
        $couponId = null;

        if (! empty($couponCode)) {
            $cupon = Cupon::where('codigo', $couponCode)->where('activo', true)->first();
            if ($cupon) {
                $now = now();
                $isValid = true;
                if ($cupon->fecha_inicio && $now < $cupon->fecha_inicio) {
                    $isValid = false;
                }
                if ($cupon->fecha_fin && $now > $cupon->fecha_fin) {
                    $isValid = false;
                }
                if ($cupon->limite_usos && $cupon->usos_actuales >= $cupon->limite_usos) {
                    $isValid = false;
                }
                if ($cupon->monto_minimo && $total < $cupon->monto_minimo) {
                    $isValid = false;
                }

                if ($cupon->unico_por_cliente && auth()->check()) {
                    $used = Pedido::where('usuario_id', auth()->id())
                        ->where('cupon_id', $cupon->id)
                        ->whereRaw('LOWER(estado) IN (?, ?, ?, ?)', OrderTransitions::REVENUE_STATES)
                        ->exists();
                    if ($used) {
                        throw new \Exception('Ya has utilizado este cupón en una compra anterior.');
                    }
                }

                if ($isValid) {
                    $couponId = $cupon->id;
                    $descuentoMonto = $cupon->tipo === 'porcentaje' ? ($total * ($cupon->valor / 100)) : $cupon->valor;
                }
            }
        }

        $puntosUsados = 0;
        $descuentoPuntos = 0;

        if ($usePoints && auth()->check()) {
            $user = auth()->user();
            if ($user->loyalty_points > 0) {
                // Assuming 10 points = S/ 1
                $maxDiscount = $user->loyalty_points / 10;

                // Can't discount more than the remaining total
                $remainingTotal = max(0, $total - $descuentoMonto);

                if ($maxDiscount > $remainingTotal) {
                    $descuentoPuntos = $remainingTotal;
                    $puntosUsados = (int) floor($remainingTotal * 10);
                    $descuentoPuntos = $puntosUsados / 10;
                } else {
                    $descuentoPuntos = $maxDiscount;
                    $puntosUsados = $user->loyalty_points;
                }

                $descuentoMonto += $descuentoPuntos;
            }
        }

        if (! is_finite($shippingCost) || $shippingCost < 0) {
            throw new \InvalidArgumentException('Costo de envío inválido.');
        }

        $totalConDescuento = max(0, $total - $descuentoMonto) + $shippingCost;

        if ($totalConDescuento < 2.00 && $totalConDescuento > 0) {
            throw new \Exception('El monto mínimo es de S/ 2.00 (después de descuentos)');
        }

        return [
            'total' => $total,
            'totalConDescuento' => $totalConDescuento,
            'descuentoMonto' => $descuentoMonto,
            'couponId' => $couponId,
            'cart' => $cart,
            'puntosUsados' => $puntosUsados,
        ];
    }

    public function reserveStock(array $cart, string $sessionId): void
    {
        $stockError = DB::transaction(function () use ($cart, $sessionId) {
            ReservaStock::where('expires_at', '<', now())->delete();

            $requiredByVariant = [];
            foreach ($cart as $item) {
                $variantId = $item['variante_id'] ?? null;
                if ($variantId) {
                    $requiredByVariant[$variantId] = ($requiredByVariant[$variantId] ?? 0) + (int) $item['cantidad'];
                }
            }

            foreach ($requiredByVariant as $varianteId => $requiredQuantity) {
                if ($varianteId) {
                    Variante::lockForUpdate()->find($varianteId);
                    $almacenEcommerceId = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
                    $stockReal = (int) (DB::table('stock_almacen')
                        ->where('variante_id', $varianteId)
                        ->where('almacen_id', $almacenEcommerceId)
                        ->lockForUpdate()
                        ->value('cantidad') ?? 0);

                    $reservado = ReservaStock::where('variante_id', $varianteId)
                        ->where('session_id', '!=', $sessionId)
                        ->where('expires_at', '>', now())
                        ->sum('cantidad');

                    $stockDisponible = max(0, $stockReal - $reservado);

                    if ($requiredQuantity > $stockDisponible) {
                        return "Stock insuficiente para la variante {$varianteId}. Solo quedan {$stockDisponible} unidades disponibles.";
                    }
                }
            }

            ReservaStock::where('session_id', $sessionId)->delete();
            foreach ($cart as $item) {
                if (isset($item['variante_id'])) {
                    ReservaStock::create([
                        'session_id' => $sessionId,
                        'variante_id' => $item['variante_id'],
                        'cantidad' => $item['cantidad'],
                        'expires_at' => now()->addMinutes(15),
                    ]);
                }
            }

            return null;
        });

        if ($stockError) {
            throw new \Exception($stockError);
        }
    }

    public function createPendingOrder(array $checkoutData, array $shippingAddress, ?string $documentoCliente, ?string $nombreFacturacion, ?string $direccionFacturacion, string $tipoComprobante, float $shippingCost): Pedido
    {
        return DB::transaction(function () use ($checkoutData, $shippingAddress, $documentoCliente, $nombreFacturacion, $direccionFacturacion, $tipoComprobante, $shippingCost) {
            if (auth()->check() && ! empty($shippingAddress['guardarDireccion'])) {
                DireccionUsuario::firstOrCreate([
                    'usuario_id' => auth()->id(),
                    'direccion' => $shippingAddress['direccion'],
                    'distrito' => $shippingAddress['distrito'],
                ], [
                    'referencia' => $shippingAddress['referencia'] ?? '',
                    'departamento' => 'LIMA',
                    'provincia' => 'LIMA',
                ]);
            }

            $codigoPedido = session('checkout_pedido') ?: 'PED-'.date('ymd').'-'.strtoupper(Str::random(6));

            if (auth()->id()) {
                Usuario::whereKey(auth()->id())->lockForUpdate()->firstOrFail();
            }
            $pedido = Pedido::where('codigo', $codigoPedido)->lockForUpdate()->first();
            if ($pedido && ($pedido->usuario_id != auth()->id() || strtolower($pedido->estado) !== 'pendiente')) {
                throw new \InvalidArgumentException('El pedido de esta sesión ya no puede modificarse.');
            }
            $pedidoData = [
                'usuario_id' => auth()->id(),
                'codigo' => $codigoPedido,
                'subtotal' => $checkoutData['total'],
                'descuento' => $checkoutData['descuentoMonto'],
                'costo_envio' => $shippingCost,
                'total' => $checkoutData['totalConDescuento'],
                'tipo_comprobante' => $tipoComprobante,
                'documento_cliente' => $documentoCliente,
                'nombre_facturacion' => $nombreFacturacion,
                'direccion_facturacion' => $direccionFacturacion,
                'direccion_envio_snapshot' => $shippingAddress,
                'cupon_id' => $checkoutData['couponId'],
                'puntos_usados' => (int) ($checkoutData['puntosUsados'] ?? 0),
                'igv_porcentaje' => (float) ConfiguracionSitio::obtener('igv_porcentaje', 18),
            ];

            if (! $pedido) {
                $pedidoData['estado'] = 'Pendiente';
                $pedido = Pedido::create($pedidoData);
            } elseif ($pedido->estado === 'Pendiente') {
                $pedido->update($pedidoData);
                $pedido->items()->delete();
            }

            if ($pedido->estado === 'Pendiente') {
                foreach ($checkoutData['cart'] as $item) {
                    $variant = Variante::with('producto')->findOrFail($item['variante_id']);
                    $pedido->items()->create([
                        'variante_id' => $item['variante_id'] ?? null,
                        'cantidad' => $item['cantidad'],
                        'precio_unitario' => $item['precio'],
                        'producto_nombre' => $variant->producto?->nombre,
                        'sku' => $variant->sku,
                        'almacen_id' => (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1),
                    ]);
                }
            }

            BenefitReservations::reserve($pedido);
            session([
                'checkout_pedido' => $codigoPedido,
                'checkout_monto' => $checkoutData['totalConDescuento'],
                'checkout_cupon_id' => $checkoutData['couponId'],
            ]);

            return $pedido;
        });
    }

    public function processSuccessfulPayment(string $codigoPedido, float $montoPagado, ?string $transactionReference = null): bool
    {
        return DB::transaction(function () use ($codigoPedido, $montoPagado, $transactionReference) {
            $pedido = Pedido::with('items')->where('codigo', $codigoPedido)->lockForUpdate()->first();

            if ($pedido && $pedido->estado === 'Pendiente') {
                if (abs($montoPagado - $pedido->total) > 0.01) {
                    Log::warning("Webhook Niubiz: Monto pagado ($montoPagado) no coincide con total del pedido {$pedido->codigo} ({$pedido->total}).");

                    TransaccionPago::create([
                        'pedido_id' => $pedido->id,
                        'referencia_pasarela' => $transactionReference,
                        'pasarela' => 'niubiz',
                        'monto' => $montoPagado,
                        'estado' => 'fallido',
                        'error_message' => 'Monto inválido',
                    ]);

                    throw new \Exception('Monto inválido');
                }

                $benefitUser = $pedido->usuario_id ? Usuario::whereKey($pedido->usuario_id)->lockForUpdate()->first() : null;
                if ($pedido->cupon_id) {
                    $coupon = Cupon::whereKey($pedido->cupon_id)->lockForUpdate()->firstOrFail();
                    $used = $coupon->unico_por_cliente && $benefitUser && Pedido::where('usuario_id', $benefitUser->id)
                        ->where('cupon_id', $coupon->id)->where('id', '!=', $pedido->id)
                        ->whereRaw('LOWER(estado) IN (?, ?, ?, ?)', OrderTransitions::REVENUE_STATES)->exists();
                    if (! $coupon->activo || ($coupon->limite_usos && $coupon->usos_actuales >= $coupon->limite_usos) || $used) {
                        throw new \RuntimeException('El cupón ya no está disponible. El pago requiere conciliación.');
                    }
                }
                if ($pedido->puntos_usados > 0 && (! $benefitUser || $benefitUser->loyalty_points < $pedido->puntos_usados)) {
                    throw new \RuntimeException('Los puntos ya fueron consumidos por otro pedido. El pago requiere conciliación.');
                }
                $pedido->update(['estado' => 'Pagado', 'stock_consumed_at' => now()]);

                TransaccionPago::create([
                    'pedido_id' => $pedido->id,
                    'referencia_pasarela' => $transactionReference,
                    'pasarela' => 'niubiz',
                    'monto' => $montoPagado,
                    'estado' => 'exitoso',
                ]);

                Pago::updateOrCreate(
                    ['pedido_id' => $pedido->id],
                    ['metodo' => 'niubiz', 'monto' => $montoPagado, 'estado' => 'completado']
                );

                if ($pedido->cupon_id) {
                    Cupon::where('id', $pedido->cupon_id)->increment('usos_actuales');
                }

                if ($pedido->puntos_usados > 0) {
                    $user = $benefitUser;

                    $user->decrement('loyalty_points', $pedido->puntos_usados);
                    LoyaltyPointsHistory::create([
                        'usuario_id' => $user->id,
                        'points' => $pedido->puntos_usados,
                        'type' => 'redeemed',
                        'description' => "Puntos usados en el pedido {$pedido->codigo}",
                    ]);

                }

                foreach ($pedido->items->sortBy('variante_id') as $item) {
                    if ($item->variante_id) {
                        $variante = Variante::lockForUpdate()->find($item->variante_id);
                        if ($variante) {
                            $almacenEcommerceId = (int) ($item->almacen_id ?: ConfiguracionSitio::obtener('almacen_ecommerce_id', 1));
                            $item->update(['costo_unitario' => $variante->precio_compra]);

                            $stockAlmacen = DB::table('stock_almacen')
                                ->where('variante_id', $item->variante_id)
                                ->where('almacen_id', $almacenEcommerceId)
                                ->lockForUpdate()
                                ->first();

                            if (! $stockAlmacen || $stockAlmacen->cantidad < $item->cantidad) {
                                throw new \RuntimeException('Stock insuficiente para completar el pedido.');
                            }

                            DB::table('stock_almacen')->where('id', $stockAlmacen->id)->decrement('cantidad', $item->cantidad);

                            DB::statement('UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?', [$item->variante_id, $item->variante_id]);

                            DB::table('movimientos_almacen')->insert([
                                'almacen_id' => $almacenEcommerceId,
                                'variante_id' => $item->variante_id,
                                'tipo' => 'salida',
                                'cantidad' => -$item->cantidad,
                                'referencia' => 'Venta Ecommerce Niubiz - '.$pedido->codigo,
                                'usuario_id' => $pedido->usuario_id ?? 1,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                if ($pedido->crm_deal_id) {
                    $deal = CrmDeal::whereKey($pedido->crm_deal_id)->lockForUpdate()->first();
                    if ($deal) {
                        app(CrmPipelineService::class)->updateDealStage($deal, ['stage_id' => $deal->stage_id, 'estado' => 'won']);
                    }
                }
                DB::table('checkout_benefit_reservations')->where('pedido_id', $pedido->id)->delete();
                $pedido->load('items');
                $pedido->update(['invoice_snapshot' => InvoiceSnapshot::order($pedido)]);

                DB::afterCommit(function () use ($pedido) {
                    ProcessSunatInvoiceJob::dispatch($pedido);
                });

                return true;
            }

            return false;
        });
    }

    public function finalizeSuccessAction(string $codigoPedido, ?string $paymentEmail): void
    {
        $pedido = Pedido::where('codigo', $codigoPedido)->first();
        if ($pedido) {
            $correoDestino = $paymentEmail ?: ($pedido->usuario ? $pedido->usuario->email : null);
            if ($correoDestino) {
                SendOrderConfirmationJob::dispatch($pedido->id, $correoDestino);
            }
            if ($pedido->usuario && ! empty($pedido->usuario->telefono)) {
                $mensaje = "¡Hola {$pedido->usuario->nombres}! Tu pedido {$pedido->codigo} ha sido confirmado por un total de S/ {$pedido->total}. ¡Gracias por comprar en NOVAPE!";
                SendWhatsAppNotification::dispatch($pedido->usuario->telefono, $mensaje);
            }
        }
    }
}
