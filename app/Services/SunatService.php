<?php

namespace App\Services;

use App\Models\Pedido;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SunatService
{
    protected $apiUrl;

    protected $apiToken;

    public function __construct()
    {
        $this->apiUrl = config('services.apiperu.url');
        $this->apiToken = config('services.apiperu.token');
    }

    /**
     * Emite un comprobante electrónico (Boleta o Factura) para un pedido pagado.
     * Requiere un proveedor configurado; nunca simula aceptación.
     */
    public function emitirComprobante(Pedido $pedido)
    {
        if ($pedido->getAttribute('seed_batch')) return ['success' => false, 'error' => 'Los pedidos de demostración no se emiten ante el proveedor fiscal.'];
        if (! $this->apiToken || ! $this->apiUrl || $this->apiToken === 'SIMULACION_TOKEN') {
            return ['success' => false, 'error' => 'La facturación electrónica requiere configurar el proveedor. No se emitió ningún comprobante.'];
        }
        $result = Cache::lock('sunat_invoice_'.$pedido->id, 120)->get(function () use ($pedido) {
            $pedido->refresh();

            return $this->emitirConBloqueo($pedido);
        });

        return $result ?: ['success' => false, 'error' => 'La emisión de este pedido ya se está procesando.'];
    }

    private function emitirConBloqueo(Pedido $pedido): array
    {
        // Evitar duplicidades
        if ($pedido->facturado_sunat) {
            return [
                'success' => true,
                'message' => 'El pedido ya fue facturado.',
            ];
        }
        if (! in_array(strtolower($pedido->estado), ['pagado', 'procesando', 'enviado', 'completado'], true)) {
            return ['success' => false, 'error' => 'Solo se pueden emitir comprobantes de pedidos pagados.'];
        }

        // Determinar si es Boleta (DNI) o Factura (RUC) basándonos en los datos del pedido o checkout
        // Aquí asumimos que tienes un campo en `checkout_facturacion` o usas el DNI del usuario
        $esFactura = strtolower($pedido->tipo_comprobante ?? '') === 'factura';
        $snapshot = $pedido->invoice_snapshot ?? [];
        $igvRate = (float) ($snapshot['igv_porcentaje'] ?? $pedido->igv_porcentaje ?? 18);
        $taxFactor = 1 + $igvRate / 100;
        $tipoDoc = $esFactura ? '01' : '03'; // 01=Factura, 03=Boleta
        $receipt = app(\App\Services\Orders\PaidInvoiceRegistry::class)->register($pedido);
        if (! $receipt->serie || ! $receipt->numero) return ['success' => false, 'error' => 'Configura una serie activa antes de emitir el comprobante.'];
        $serie = $receipt->serie;
        $correlativo = $receipt->numero;

        // Construir el Payload formato API Peru
        $payload = [
            'operacion' => 'generar_comprobante',
            'tipo_de_comprobante' => $tipoDoc,
            'serie' => $serie,
            'numero' => $correlativo,
            'sunat_transaction' => '1',
            'cliente_tipo_de_documento' => $esFactura ? '6' : '1', // 6=RUC, 1=DNI
            'cliente_numero_de_documento' => $snapshot['documento_cliente'] ?? $pedido->documento_cliente ?? $pedido->usuario?->dni,
            'cliente_denominacion' => $snapshot['nombre_cliente'] ?? $pedido->nombre_facturacion ?? $pedido->usuario?->nombre_completo,
            'cliente_direccion' => $snapshot['direccion_cliente'] ?? $pedido->direccion_facturacion ?? '',
            'cliente_email' => $pedido->usuario ? $pedido->usuario->email : '',
            'fecha_de_emision' => date('Y-m-d'),
            'moneda' => '1', // Soles
            'porcentaje_de_igv' => $igvRate,
            'total_gravada' => round($pedido->total / $taxFactor, 2),
            'total_igv' => round($pedido->total - ($pedido->total / $taxFactor), 2),
            'total' => $pedido->total,
            'enviar_automaticamente_a_la_sunat' => true,
            'enviar_automaticamente_al_cliente' => (bool) config('invoicing.notify_email'),
            'items' => [],
        ];

        // Allocate the order discount across lines so their totals reconcile.
        $gross = (float) $pedido->items->sum(fn ($item) => $item->precio_unitario * $item->cantidad);
        $shipping = (float) ($snapshot['costo_envio'] ?? $pedido->costo_envio);
        $merchandise = round((float) $pedido->total - $shipping, 2);
        if ($gross <= 0 || $merchandise < 0 || $merchandise > $gross + 0.01) {
            return ['success' => false, 'error' => 'El importe del pedido no concilia con sus artículos.'];
        }
        $remaining = $merchandise;
        foreach ($pedido->items->values() as $index => $item) {
            $lineTotal = $index === $pedido->items->count() - 1 ? $remaining : round($merchandise * ($item->precio_unitario * $item->cantidad) / $gross, 2);
            $remaining = round($remaining - $lineTotal, 2);
            $net = round($lineTotal / $taxFactor, 2);
            $payload['items'][] = [
                'unidad_de_medida' => 'NIU', 'codigo' => $item->sku ?? $item->variante->sku ?? 'P01',
                'descripcion' => $item->producto_nombre ?? $item->variante->producto->nombre ?? 'Producto',
                'cantidad' => $item->cantidad, 'valor_unitario' => round($lineTotal / $item->cantidad / $taxFactor, 6),
                'precio_unitario' => round($lineTotal / $item->cantidad, 6), 'subtotal' => $net,
                'tipo_de_igv' => '1', 'igv' => round($lineTotal - $net, 2), 'total' => $lineTotal,
                'anticipo_regularizacion' => false,
            ];
        }
        if ($shipping > 0) {
            $net = round($shipping / $taxFactor, 2);
            $payload['items'][] = ['unidad_de_medida' => 'ZZ', 'codigo' => 'ENVIO', 'descripcion' => 'Servicio de envío',
                'cantidad' => 1, 'valor_unitario' => $net, 'precio_unitario' => $shipping, 'subtotal' => $net,
                'tipo_de_igv' => '1', 'igv' => round($shipping - $net, 2), 'total' => $shipping, 'anticipo_regularizacion' => false];
        }
        $payload['total_gravada'] = round(array_sum(array_column($payload['items'], 'subtotal')), 2);
        $payload['total_igv'] = round(array_sum(array_column($payload['items'], 'igv')), 2);

        // La aceptación depende exclusivamente de la respuesta del proveedor.
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->apiToken,
                'Content-Type' => 'application/json',
            ])->connectTimeout(5)->timeout(30)->post($this->apiUrl, $payload);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['success']) && $data['success']) {
                    $pedido->comprobante_tipo = $esFactura ? 'Factura' : 'Boleta';
                    $pedido->comprobante_serie = $serie;
                    $pedido->comprobante_correlativo = $correlativo;
                    $pedido->enlace_pdf = $data['data']['enlaces']['pdf'] ?? null;
                    $pedido->enlace_xml = $data['data']['enlaces']['xml'] ?? null;
                    $pedido->facturado_sunat = true;
                    $pedido->save();
                    $receipt->update(['estado_sunat' => 'aceptado', 'emitido_at' => now(), 'ruta_pdf' => null]);

                    Log::info("SUNAT EXITO: Comprobante generado $serie-$correlativo");

                    return ['success' => true];
                }
            }

            Log::error('SUNAT ERROR API: '.$response->body());

            return ['success' => false, 'error' => 'La API de SUNAT rechazó la petición.'];

        } catch (\Exception $e) {
            Log::error('SUNAT EXCEPTION: '.$e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
