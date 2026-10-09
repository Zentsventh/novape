<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\Invoices\InvoiceGenerationService;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function __construct(
        private readonly InvoiceGenerationService $invoiceService
    ) {}

    public function generarFacturaPos(int $id)
    {
        $venta = DB::table('ventas_pos')->where('id', $id)->first();
        abort_if(! $venta, 404);
        abort_unless(auth('admin')->user()->esAdmin() || $venta->cajero_id == auth('admin')->id(), 403);
        try {
            $pdfPath = $this->invoiceService->generatePosInvoice($id);
            $pdfName = basename($pdfPath);

            return response()->download($pdfPath, $pdfName, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$pdfName.'"',
            ]);
        } catch (\Exception $e) {
            abort(404, $e->getMessage());
        }
    }

    public function verComprobantePublico(string $codigo_ticket)
    {
        try {
            $pdfPath = $this->invoiceService->getPublicInvoicePath($codigo_ticket);

            return response()->file($pdfPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.basename($pdfPath).'"',
            ]);
        } catch (\Exception $e) {
            abort(404, $e->getMessage());
        }
    }
}
