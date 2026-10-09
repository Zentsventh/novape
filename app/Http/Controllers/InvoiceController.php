<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Services\Admin\Invoices\InvoiceGenerationService;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceGenerationService $invoiceGenerationService
    ) {}

    public function descargarComprobante($pedidoId)
    {
        $pedido = Pedido::findOrFail($pedidoId);

        if (Auth::id() !== $pedido->usuario_id && ! Auth::user()->esAdmin()) {
            abort(403, 'No tienes permiso para ver este comprobante.');
        }

        return $this->downloadPaid($pedido);
    }

    public function verComprobanteEcommerce(string $codigo)
    {
        $pedido = Pedido::where('codigo', $codigo)->firstOrFail();
        return $this->downloadPaid($pedido);
    }

    private function downloadPaid(Pedido $pedido)
    {
        abort_unless(in_array(strtolower($pedido->estado), \App\Services\Orders\OrderTransitions::REVENUE_STATES, true), 403);
        $receipt = app(\App\Services\Orders\PaidInvoiceRegistry::class)->register($pedido);
        if (! $receipt->ruta_pdf || ! \Illuminate\Support\Facades\Storage::disk('local')->exists($receipt->ruta_pdf)) {
            $path = 'comprobantes/ecommerce/'.$pedido->id.'/'.$receipt->codigo_ticket.'.pdf';
            \Illuminate\Support\Facades\Storage::disk('local')->put($path, app(\App\Services\Orders\InvoiceService::class)->generatePdf($pedido)->output());
            $receipt->update(['ruta_pdf' => $path]);
        }
        return \Illuminate\Support\Facades\Storage::disk('local')->download($receipt->ruta_pdf, 'comprobante_'.$pedido->codigo.'.pdf', ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store']);
    }
}
