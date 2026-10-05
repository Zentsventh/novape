<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;

final class InvoiceSnapshot
{
    public static function order(Pedido $order): array
    {
        return [
            'empresa' => config('invoicing.company'),
            'igv_porcentaje' => (float) ($order->igv_porcentaje ?? 18),
            'nombre_cliente' => $order->nombre_facturacion ?? $order->usuario?->nombre_completo,
            'documento_cliente' => $order->documento_cliente ?? $order->usuario?->dni,
            'direccion_cliente' => $order->direccion_facturacion,
            'tipo_comprobante' => $order->tipo_comprobante,
            'subtotal' => (float) $order->subtotal,
            'costo_envio' => (float) $order->costo_envio,
            'descuento' => (float) $order->descuento,
            'total' => (float) $order->total,
            'items' => $order->items->map(fn ($item) => [
                'cantidad' => $item->cantidad, 'precio_unitario' => $item->precio_unitario,
                'sku' => $item->sku,
                'producto_nombre' => $item->producto_nombre ?? $item->variante?->producto?->nombre,
            ])->all(),
        ];
    }
}
