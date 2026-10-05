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
        $esFactura = $pedido->tipo_comprobante === 'factura';
        $tipoDoc = $esFactura ? '01' : '03'; // 01=Factura, 03=Boleta
        $serie = $esFactura ? 'F001' : 'B001';
        $correlativo = str_pad((string) $pedido->id, 6, '0', STR_PAD_LEFT);

        // Construir el Payload formato API Peru
        $payload = [
            'operacion' => 'generar_comprobante',
            'tipo_de_comprobante' => $tipoDoc,
            'serie' => $serie,
            'numero' => $correlativo,
            'sunat_transaction' => '1',
            'cliente_tipo_de_documento' => $esFactura ? '6' : '1', // 6=RUC, 1=DNI
            'cliente_numero_de_documento' => $pedido->documento_cliente ?? $pedido->usuario?->dni,
            'cliente_denominacion' => $pedido->nombre_facturacion ?? $pedido->usuario?->nombre_completo,
            'cliente_direccion' => 'LIMA',
            'cliente_email' => $pedido->usuario ? $pedido->usuario->email : '',
            'fecha_de_emision' => date('Y-m-d'),
            'moneda' => '1', // Soles
            'porcentaje_de_igv' => 18.00,
            'total_gravada' => round($pedido->total / 1.18, 2),
            'total_igv' => round($pedido->total - ($pedido->total / 1.18), 2),
            'total' => $pedido->total,
            'enviar_automaticamente_a_la_sunat' => true,
            'enviar_automaticamente_al_cliente' => true,
            'items' => [],
        ];

        // Rellenar Items
        foreach ($pedido->items as $item) {
            $precioSinIgv = $item->precio_unitario / 1.18;
            $payload['items'][] = [
                'unidad_de_medida' => 'NIU', // Producto
                'codigo' => $item->variante ? $item->variante->sku : 'P01',
                'descripcion' => $item->variante ? $item->variante->producto->nombre : 'Producto',
                'cantidad' => $item->cantidad,
                'valor_unitario' => round($precioSinIgv, 2),
                'precio_unitario' => $item->precio_unitario,
                'subtotal' => round($precioSinIgv * $item->cantidad, 2),
                'tipo_de_igv' => '1',
                'igv' => round(($item->precio_unitario - $precioSinIgv) * $item->cantidad, 2),
                'total' => $item->precio_unitario * $item->cantidad,
                'anticipo_regularizacion' => false,
            ];
        }

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
