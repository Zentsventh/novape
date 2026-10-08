<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Comprobante;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;

class PaidInvoiceRegistry
{
    public function register(Pedido $order): Comprobante
    {
        return DB::transaction(function () use ($order) {
            $order = Pedido::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (! $order->invoice_snapshot) {
                $order->load(['items.variante.producto', 'usuario']);
                $order->update(['invoice_snapshot' => InvoiceSnapshot::order($order)]);
            }
            $environment = $order->getAttribute('seed_batch') ? 'demo' : config('invoicing.environment', 'sandbox');
            if ($receipt = Comprobante::where('pedido_id', $order->id)->where('fiscal_environment', $environment)->orderBy('id')->first()) {
                return $receipt;
            }
            if (! in_array(strtolower($order->estado), OrderTransitions::REVENUE_STATES, true)) {
                throw new \RuntimeException('El comprobante solo está disponible para pedidos pagados.');
            }
            $snapshot = $order->invoice_snapshot;
            $type = strtolower($snapshot['tipo_comprobante'] ?? $order->tipo_comprobante ?? 'boleta');
            $series = $order->comprobante_serie;
            $number = $order->comprobante_correlativo;
            if (! $series || ! $number) {
                $sequence = DB::table('comprobantes_series')->where('tipo_comprobante', $type)->where('activo', true)->orderBy('id')->lockForUpdate()->first();
                if ($sequence) {
                    $series = $sequence->serie;
                    $number = str_pad((string) ($sequence->correlativo_actual + 1), 8, '0', STR_PAD_LEFT);
                    DB::table('comprobantes_series')->where('id', $sequence->id)->increment('correlativo_actual');
                }
            }
            $total = (float) $snapshot['total'];
            $net = round($total / (1 + (float) ($snapshot['igv_porcentaje'] ?? 18) / 100), 2);
            return Comprobante::create([
                'fiscal_environment' => $environment,
                'pedido_id' => $order->id, 'tipo' => $type, 'serie' => $series, 'numero' => $number,
                'codigo_ticket' => 'EC-'.$order->codigo, 'estado_sunat' => $order->facturado_sunat ? 'aceptado' : 'pendiente',
                'total' => $total, 'operaciones_gravadas' => $net, 'igv' => round($total - $net, 2),
                'cliente_nombre' => $snapshot['nombre_cliente'], 'cliente_documento' => $snapshot['documento_cliente'],
                'cliente_tipo_documento' => $type === 'factura' ? 'RUC' : ($order->direccion_envio_snapshot['tipoDoc'] ?? 'DNI'),
                'emitido_at' => $order->facturado_sunat ? now() : null,
            ]);
        });
    }
}
