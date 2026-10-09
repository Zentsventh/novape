<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;

final class OrderTransitions
{
    public const REVENUE_STATES = ['pagado', 'procesando', 'enviado', 'completado'];

    public static function validate(Pedido $order, string $target): void
    {
        $source = strtolower($order->estado);
        $target = strtolower($target);
        if ($target === 'cancelado' && in_array($order->pago?->estado, ['completado', 'reembolso_pendiente'], true)) {
            throw new \InvalidArgumentException('Confirma primero la anulación en Niubiz.');
        }
        if ($source === $target) {
            return;
        }
        $allowed = [
            'pendiente' => ['cancelado'],
            'pagado' => ['procesando', 'cancelado'],
            'procesando' => ['enviado', 'cancelado'],
            'enviado' => ['completado', 'cancelado'],
            'completado' => ['cancelado'],
            'cancelado' => [],
        ];
        if (($order->direccion_envio_snapshot['delivery_type'] ?? '') === 'tienda' || ($order->direccion_envio_snapshot['shipping_quote']['source'] ?? '') === 'pickup') {
            $allowed['procesando'] = ['completado', 'cancelado'];
            $allowed['pagado'] = ['procesando', 'cancelado'];
            if ($target === 'enviado') throw new \InvalidArgumentException('Los pedidos de retiro no se despachan: confirma Listo para recoger y después Recogido.');
        }
        if (! in_array($target, $allowed[$source] ?? [], true)) {
            throw new \InvalidArgumentException('La transición de '.$source.' a '.$target.' no está permitida.');
        }
        if ($target !== 'cancelado' && $order->pago?->estado !== 'completado') {
            throw new \InvalidArgumentException('El pedido necesita un pago confirmado antes de avanzar.');
        }
    }
}
