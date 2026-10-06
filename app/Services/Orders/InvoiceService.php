<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Helpers\NumberToWords;
use App\Models\Pedido;
use Barryvdh\DomPDF\PDF;
use Illuminate\Support\Facades\URL;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class InvoiceService
{
    /**
     * @return PDF
     */
    public function generatePdf(Pedido $pedido)
    {
        $pedido = clone $pedido;
        $snapshot = $pedido->invoice_snapshot ?? [];
        foreach (['nombre_cliente' => 'nombre_facturacion', 'documento_cliente' => 'documento_cliente', 'direccion_cliente' => 'direccion_facturacion', 'total' => 'total', 'subtotal' => 'subtotal', 'descuento' => 'descuento', 'costo_envio' => 'costo_envio'] as $source => $target) {
            if (array_key_exists($source, $snapshot)) {
                $pedido->setAttribute($target, $snapshot[$source]);
            }
        }
        $logoPath = public_path('images/logofactura.png');
        $logoBase64 = null;
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath));
        } else {
            $logoPath = public_path('images/logo.png');
            if (file_exists($logoPath)) {
                $logoBase64 = 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath));
            }
        }

        $qrBase64 = null;
        if (class_exists(QrCode::class)) {
            $qrContent = URL::signedRoute('comprobante.ecommerce.publico', ['codigo' => $pedido->codigo]);
            $qrSvg = QrCode::size(150)->generate($qrContent);
            $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode((string) $qrSvg);
        }

        $letras = null;
        if (class_exists(NumberToWords::class)) {
            $letras = NumberToWords::convert((float) $pedido->total);
        }

        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', [
            'pedido' => $pedido,
            'empresa' => $pedido->invoice_snapshot['empresa'] ?? config('invoicing.company'),
            'igvPorcentaje' => (float) ($pedido->invoice_snapshot['igv_porcentaje'] ?? $pedido->igv_porcentaje ?? 18),
            'logoBase64' => $logoBase64,
            'qrBase64' => $qrBase64,
            'letras' => $letras,
        ])->setPaper('a4');
    }
}
