<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Pedido;
use Illuminate\Support\Facades\Auth;
use App\Services\Admin\Invoices\InvoiceGenerationService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\Response;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceGenerationService $invoiceGenerationService
    ) {}

    public function descargarComprobante($pedidoId)
    {
        $pedido = Pedido::with(['items.variante.producto', 'usuario'])->findOrFail($pedidoId);

        if (Auth::id() !== $pedido->usuario_id && !Auth::user()->esAdmin()) {
            abort(403, 'No tienes permiso para ver este comprobante.');
        }

        return $this->invoiceGenerationService->downloadInvoicePdf($pedido);
    }
}
