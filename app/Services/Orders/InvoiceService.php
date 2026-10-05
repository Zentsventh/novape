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
            $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);
        }

        $letras = null;
        if (class_exists(NumberToWords::class)) {
            $letras = NumberToWords::convert((float) $pedido->total);
        }

        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', [
            'pedido' => $pedido,
            'logoBase64' => $logoBase64,
            'qrBase64' => $qrBase64,
            'letras' => $letras,
        ])->setPaper('a4');
    }
}
