<?php

declare(strict_types=1);

namespace App\Services\Checkout;

use App\Models\ConfiguracionSitio;
use App\Models\Cupon;
use App\Models\DireccionUsuario;
use App\Models\Pedido;
use App\Models\ReservaStock;
use App\Models\Variante;
use App\Services\SunatService;
use App\Jobs\SendOrderConfirmationJob;
use App\Jobs\SendWhatsAppNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CheckoutService
{
    public function validateAndCalculateTotal(array $cart, ?string $couponCode, float $shippingCost, bool $usePoints = false): array
    {
        $total = 0;
        foreach ($cart as &$item) {
            if (isset($item['variante_id'])) {
                $variante = Variante::find($item['variante_id']);
                if ($variante) {
                    $item['precio'] = (float) $variante->precio;
                }
            }
            $total += ($item['precio'] * $item['cantidad']);
        }
        unset($item);

        if ($total <= 0) {
            throw new \Exception('Carrito vacío');
        }

        $descuentoMonto = 0;
        $couponId = null;

        if (!empty($couponCode)) {
            $cupon = Cupon::where('codigo', $couponCode)->where('activo', true)->first();
            if ($cupon) {
                $now = now();
                $isValid = true;
                if ($cupon->fecha_inicio && $now < $cupon->fecha_inicio) $isValid = false;
                if ($cupon->fecha_fin && $now > $cupon->fecha_fin) $isValid = false;
                if ($cupon->limite_usos && $cupon->usos_actuales >= $cupon->limite_usos) $isValid = false;
                if ($cupon->monto_minimo && $total < $cupon->monto_minimo) $isValid = false;

                if ($cupon->unico_por_cliente && auth()->check()) {
                    $used = Pedido::where('usuario_id', auth()->id())
                        ->where('cupon_id', $cupon->id)
                        ->where('estado', 'Pagado')
                        ->exists();
                    if ($used) throw new \Exception('Ya has utilizado este cupón en una compra anterior.');
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
                    $puntosUsados = $remainingTotal * 10;
                } else {
                    $descuentoPuntos = $maxDiscount;
                    $puntosUsados = $user->loyalty_points;
                }
                
                $descuentoMonto += $descuentoPuntos;
            }
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

            foreach ($cart as $item) {
                $varianteId = $item['variante_id'] ?? null;
                if ($varianteId) {
                    $variante = Variante::lockForUpdate()->find($varianteId);
                    $stockReal = $variante ? $variante->stock : 0;

                    $reservado = ReservaStock::where('variante_id', $varianteId)
                        ->where('session_id', '!=', $sessionId)
                        ->sum('cantidad');
                    
                    $stockDisponible = max(0, $stockReal - $reservado);

                    if ($item['cantidad'] > $stockDisponible) {
                        return "Stock insuficiente para el producto: {$item['nombre']}. Solo quedan {$stockDisponible} unidades disponibles.";
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
                        'expires_at' => now()->addMinutes(15)
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
            if (auth()->check() && !empty($shippingAddress['guardarDireccion'])) {
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

            $pedido = Pedido::where('codigo', $codigoPedido)->first();
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
                'puntos_usados' => $checkoutData['puntosUsados'] ?? 0,
            ];

            if (!$pedido) {
                $pedidoData['estado'] = 'Pendiente';
                $pedido = Pedido::create($pedidoData);
            } elseif ($pedido->estado === 'Pendiente') {
                $pedido->update($pedidoData);
                $pedido->items()->delete();
            }

            if ($pedido->estado === 'Pendiente') {
                foreach ($checkoutData['cart'] as $item) {
                    $pedido->items()->create([
                        'variante_id' => $item['variante_id'] ?? null,
                        'cantidad' => $item['cantidad'],
                        'precio_unitario' => $item['precio'],
                    ]);
                }
            }

            session([
                'checkout_pedido' => $codigoPedido,
                'checkout_monto' => $checkoutData['totalConDescuento'],
                'checkout_cupon_id' => $checkoutData['couponId'],
            ]);

            return $pedido;
        });
    }

    public function processSuccessfulPayment(string $codigoPedido, float $montoPagado, ?string $paymentIntentId = null, string $pasarela = 'stripe'): bool
    {
        return DB::transaction(function () use ($codigoPedido, $montoPagado, $paymentIntentId, $pasarela) {
            $pedido = Pedido::with('items')->where('codigo', $codigoPedido)->lockForUpdate()->first();

            if ($pedido && $pedido->estado === 'Pendiente') {
                if (abs($montoPagado - $pedido->total) > 0.01) {
                    Log::warning("Webhook {$pasarela}: Monto pagado ($montoPagado) no coincide con total del pedido {$pedido->codigo} ({$pedido->total}).");
                    
                    \App\Models\TransaccionPago::create([
                        'pedido_id' => $pedido->id,
                        'payment_intent_id' => $paymentIntentId,
                        'pasarela' => $pasarela,
                        'monto' => $montoPagado,
                        'estado' => 'fallido',
                        'error_message' => 'Monto inválido'
                    ]);

                    throw new \Exception('Monto inválido');
                }

                $pedido->update(['estado' => 'Pagado']);

                \App\Models\TransaccionPago::create([
                    'pedido_id' => $pedido->id,
                    'payment_intent_id' => $paymentIntentId,
                    'pasarela' => $pasarela,
                    'monto' => $montoPagado,
                    'estado' => 'exitoso'
                ]);

                if ($pedido->cupon_id) {
                    Cupon::where('id', $pedido->cupon_id)->increment('usos_actuales');
                }

                if ($pedido->puntos_usados > 0 && $pedido->usuario_id) {
                    $user = \App\Models\Usuario::find($pedido->usuario_id);
                    if ($user) {
                        $user->decrement('loyalty_points', $pedido->puntos_usados);
                        \App\Models\LoyaltyPointsHistory::create([
                            'usuario_id' => $user->id,
                            'points' => $pedido->puntos_usados,
                            'type' => 'redeemed',
                            'description' => "Puntos usados en el pedido {$pedido->codigo}",
                        ]);
                    }
                }

                foreach ($pedido->items as $item) {
                    if ($item->variante_id) {
                        $variante = Variante::lockForUpdate()->find($item->variante_id);
                        if ($variante) {
                            $almacenEcommerceId = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);

                            $stockAlmacen = DB::table('stock_almacen')
                                ->where('variante_id', $item->variante_id)
                                ->where('almacen_id', $almacenEcommerceId)
                                ->first();

                            if ($stockAlmacen) {
                                DB::table('stock_almacen')->where('id', $stockAlmacen->id)->decrement('cantidad', $item->cantidad);
                            } else {
                                DB::table('stock_almacen')->insert([
                                    'almacen_id' => $almacenEcommerceId,
                                    'variante_id' => $item->variante_id,
                                    'cantidad' => 0 - $item->cantidad,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }

                            DB::statement('UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?', [$item->variante_id, $item->variante_id]);

                            DB::table('movimientos_almacen')->insert([
                                'almacen_id' => $almacenEcommerceId,
                                'variante_id' => $item->variante_id,
                                'tipo' => 'salida',
                                'cantidad' => -$item->cantidad,
                                'referencia' => 'Venta Ecommerce Stripe - '.$pedido->codigo,
                                'usuario_id' => $pedido->usuario_id ?? 1,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                }

                // --- SINCRONIZACIÓN CON CRM ---
                if ($pedido->usuario_id) {
                    $deal = \App\Models\CrmDeal::where('usuario_id', $pedido->usuario_id)
                                ->where('estado', 'open')
                                ->first();

                    if ($deal) {
                        $deal->update([
                            'estado' => 'won',
                            'valor' => $pedido->total,
                        ]);
                        \App\Models\CrmActivity::create([
                            'deal_id' => $deal->id,
                            'tipo' => 'system',
                            'titulo' => 'Compra Completada (Web)',
                            'descripcion' => "El cliente pagó el pedido {$pedido->codigo} exitosamente por la tienda web.",
                        ]);
                    } else {
                        // Buscar etapa adecuada (última etapa o ganada)
                        $pipeline = \App\Models\CrmPipeline::with('stages')->first();
                        $stageId = 1;
                        if ($pipeline && $pipeline->stages->count() > 0) {
                            $stageGanado = $pipeline->stages()->where('nombre', 'like', '%Ganado%')->orWhere('nombre', 'like', '%Won%')->first();
                            $stageId = $stageGanado ? $stageGanado->id : $pipeline->stages->last()->id;
                        }

                        \App\Models\CrmDeal::create([
                            'usuario_id' => $pedido->usuario_id,
                            'stage_id' => $stageId,
                            'titulo' => "Venta Web Directa: {$pedido->codigo}",
                            'valor' => $pedido->total,
                            'estado' => 'won'
                        ]);
                    }
                }
                // ------------------------------

                DB::afterCommit(function () use ($pedido) {
                    \App\Jobs\ProcessSunatInvoiceJob::dispatch($pedido);
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
            if ($pedido->usuario && !empty($pedido->usuario->telefono)) {
                $mensaje = "¡Hola {$pedido->usuario->nombres}! Tu pedido {$pedido->codigo} ha sido confirmado por un total de S/ {$pedido->total}. ¡Gracias por comprar en NOVAPE!";
                SendWhatsAppNotification::dispatch($pedido->usuario->telefono, $mensaje);
            }
        }
    }
}
