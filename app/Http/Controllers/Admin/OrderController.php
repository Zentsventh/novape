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
            'refunds' => DB::table('refund_requests')->where('pedido_id', $pedido->id)->orderByDesc('id')->get(),
            'returnOptions' => \App\Models\RmaRequest::where('pedido_id', $pedido->id)->whereIn('type', ['return','exchange'])->where('status', 'processed')->select('id', 'status')->get(),
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

    public function solicitarParcial(Request $request, int $id)
    {
        $data = $request->validate(['rma_id' => 'required|integer', 'request_key' => 'required|uuid']);
        app(\App\Services\Orders\PartialRefundService::class)->request($this->orderQueryService->getOrderForRefund($id), (int) $data['rma_id'], $data['request_key'], (int) auth('admin')->id());
        return back()->with('success', 'Reembolso parcial solicitado. Confirma la operación en Niubiz y registra su evidencia.');
    }

    public function confirmarSolicitud(Request $request, int $id, int $refundId)
    {
        $data = $request->validate(['provider_reference' => 'required|string|max:128', 'amount' => 'required|numeric|gt:0', 'evidence' => 'required|string|min:20|max:5000', 'verified' => 'required|accepted']);
        app(\App\Services\Orders\PartialRefundService::class)->confirm($this->orderQueryService->getOrderForRefund($id), $refundId, $data, (int) auth('admin')->id());
        return back()->with('success', 'Devolución de dinero confirmada con evidencia.');
    }

    public function facturaVista(int $id)
    {
        try {
            $pedido = $this->orderQueryService->getOrderForInvoice($id);
            $pdf = $this->invoiceService->generatePdf($pedido);
            return $pdf->download('factura-'.$pedido->codigo.'.pdf');
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function export()
    {
        return $this->exportOrderService->exportDownload();
    }
}
