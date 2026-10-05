<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStateRequest;
use App\Services\Orders\ExportOrderService;
use App\Services\Orders\InvoiceService;
use App\Services\Orders\OrderQueryService;
use App\Services\Orders\RefundOrderService;
use App\Services\Orders\UpdateOrderStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderQueryService $orderQueryService,
        private readonly UpdateOrderStatusService $updateOrderStatusService,
        private readonly RefundOrderService $refundOrderService,
        private readonly InvoiceService $invoiceService,
        private readonly ExportOrderService $exportOrderService
    ) {}

    public function index(Request $request): Response
    {
        $pedidos = $this->orderQueryService->getPaginatedOrders($request->all());

        return Inertia::render('Admin/Pedidos/Index', [
            'pedidos' => $pedidos,
            'filtros' => [
                'search' => $request->search,
                'date_start' => $request->date_start,
                'date_end' => $request->date_end,
                'sort' => $request->input('sort', 'desc'),
            ],
        ]);
    }

    public function show(int $id): Response
    {
        $pedido = $this->orderQueryService->getOrderForShow($id);

        return Inertia::render('Admin/Pedidos/Show', [
            'pedido' => $pedido,
            'paymentReviews' => DB::table('payment_reconciliations')->where('pedido_id', $pedido->id)->whereIn('status', ['authorizing', 'approved', 'needs_review'])->select('purchase_number', 'amount', 'status', 'created_at')->get(),
        ]);
    }

    public function updateEstado(UpdateOrderStateRequest $request, int $id)
    {
        $pedido = $this->orderQueryService->getOrderForUpdate($id);

        try {
            $this->updateOrderStatusService->execute($pedido, $request->validated());

            return redirect()->back()->with('success', 'Estado del pedido y envío actualizado.');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', $e instanceof \InvalidArgumentException ? $e->getMessage() : 'Ocurrió un error al actualizar el estado del pedido.');
        }
    }

    public function reembolsar(int $id)
    {
        $pedido = $this->orderQueryService->getOrderForRefund($id);

        $result = $this->refundOrderService->execute($pedido);

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    public function confirmarReembolso(int $id)
    {
        $pedido = $this->orderQueryService->getOrderForRefund($id);
        $result = $this->refundOrderService->confirmManualRefund($pedido);

        return redirect()->back()->with($result['success'] ? 'success' : 'error', $result['message']);
    }

    public function facturaVista(int $id)
    {
        $pedido = $this->orderQueryService->getOrderForInvoice($id);

        $pdf = $this->invoiceService->generatePdf($pedido);

        return $pdf->download('factura-'.$pedido->codigo.'.pdf');
    }

    public function export()
    {
        return $this->exportOrderService->exportDownload();
    }
}
