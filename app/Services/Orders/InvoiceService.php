<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Helpers\NumberToWords;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class InvoiceService
{
    public function generatePdf(Pedido $pedido)
    {
        $receipt = app(PaidInvoiceRegistry::class)->register($pedido);
        $pedido->refresh();
        $snapshot = $pedido->invoice_snapshot;
        $payment = DB::table('payment_reconciliations')->where('pedido_id', $pedido->id)->where('status', 'applied')->first(['purchase_number', 'approved_at']);
        $logo = public_path('images/logofactura.png');
        if (! is_file($logo)) $logo = public_path('images/logo.png');
        $qr = QrCode::size(130)->generate(URL::signedRoute('comprobante.ecommerce.publico', ['codigo' => $pedido->codigo]));
        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.storefront_receipt', [
            'pedido' => $pedido, 'receipt' => $receipt, 'snapshot' => $snapshot,
            'empresa' => $snapshot['empresa'], 'items' => $snapshot['items'], 'payment' => $payment,
            'logo' => is_file($logo) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logo)) : null,
            'qr' => 'data:image/svg+xml;base64,'.base64_encode((string) $qr),
            'letras' => NumberToWords::convert((float) $snapshot['total']),
            'documentHash' => hash('sha256', json_encode([$snapshot, $pedido->codigo, $receipt->serie, $receipt->numero, $payment?->purchase_number])),
        ])->setPaper('a4')->setOptions(['isRemoteEnabled' => false]);
    }
}
