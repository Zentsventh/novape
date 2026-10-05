<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Exports\DashboardExport;
use App\Http\Controllers\Controller;
use App\Models\ConfiguracionSitio;
use App\Services\Admin\Dashboard\AnalyticsService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analyticsService
    ) {}

    public function dashboard(Request $request)
    {
        $request->validate([
            'start_date' => 'sometimes|required|date_format:Y-m-d',
            'end_date' => 'sometimes|required|date_format:Y-m-d|after_or_equal:start_date',
            'sort_order' => 'sometimes|in:asc,desc',
            'sort_by' => 'sometimes|in:created_at,total,codigo,estado,id',
            'status' => 'nullable|in:pendiente,pagado,procesando,enviado,completado,cancelado',
            'q' => 'nullable|string|max:200',
        ]);
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $sortOrder = $request->query('sort_order', 'desc');
        $sortBy = $request->query('sort_by', 'created_at');
        $status = $request->query('status');
        $q = $request->query('q');

        $stats = $this->analyticsService->getDashboardStats($startDate, $endDate, $sortBy, $sortOrder, $status, $q);

        return Inertia::render('Admin/Dashboard', array_merge($stats, [
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'sort_order' => $sortOrder,
                'sort_by' => $sortBy,
                'status' => $status,
                'q' => $q,
            ],
        ]));
    }

    public function globalSearch(Request $request)
    {
        $request->validate(['q' => 'nullable|string|max:200']);
        $q = (string) $request->query('q', '');
        if (! $q) {
            return response()->json(['productos' => [], 'pedidos' => [], 'usuarios' => []]);
        }

        return response()->json($this->analyticsService->searchGlobal($q, auth()->user()));
    }

    public function exportarPdf(Request $request)
    {
        $this->validateReportFilters($request);
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $status = $request->query('status');
        $q = $request->query('q');

        $stats = $this->analyticsService->getDashboardStats($startDate, $endDate, 'created_at', 'desc', $status, $q);

        $logoUrl = ConfiguracionSitio::obtener('logo_url');
        $logoBase64 = null;
        if ($logoUrl) {
            $logoPath = storage_path('app/public/'.str_replace('public/', '', $logoUrl));
            if (! file_exists($logoPath)) {
                $logoPath = public_path('images/logofactura.png');
            }
            if (file_exists($logoPath)) {
                $logoBase64 = 'data:'.mime_content_type($logoPath).';base64,'.base64_encode(file_get_contents($logoPath));
            }
        }

        $data = [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'ventasWeb' => $stats['ventasWeb'],
            'ventasPos' => $stats['ventasPos'],
            'ventasTotal' => $stats['ventasTotal'],
            'costosTotal' => $stats['costosTotal'],
            'gananciaNeta' => $stats['gananciaNeta'],
            'pedidosCount' => $stats['totalPedidos'],
            'pedidos' => $stats['pedidosRecientes'],
            'logoBase64' => $logoBase64,
            'stockBajo' => array_slice($this->analyticsService->getLowStock(8), 0, 8),
            'topProductosVendidos' => $this->analyticsService->getTopProducts($startDate, $endDate),
        ];

        return Pdf::loadView('pdf.dashboard', $data)
            ->setPaper('A4', 'portrait')
            ->download('reporte_dashboard_'.date('Y-m-d').'.pdf');
    }

    public function exportarExcel(Request $request)
    {
        $this->validateReportFilters($request);
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $status = $request->query('status');
        $q = $request->query('q');

        $stats = $this->analyticsService->getDashboardStats($startDate, $endDate, 'created_at', 'desc', $status, $q);

        $data = [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'ventasTotal' => $stats['ventasTotal'],
            'costosTotal' => $stats['costosTotal'],
            'gananciaNeta' => $stats['gananciaNeta'],
            'pedidosCount' => $stats['totalPedidos'],
            'pedidos' => $stats['pedidosRecientes'],
            'topProductosVendidos' => $this->analyticsService->getTopProducts($startDate, $endDate),
        ];

        return Excel::download(
            new DashboardExport($data),
            'reporte_dashboard_'.date('Y-m-d').'.xlsx'
        );
    }

    private function validateReportFilters(Request $request): void
    {
        $request->validate([
            'start_date' => 'sometimes|required|date_format:Y-m-d',
            'end_date' => 'sometimes|required|date_format:Y-m-d|after_or_equal:start_date',
            'status' => 'nullable|in:pendiente,pagado,procesando,enviado,completado,cancelado',
            'q' => 'nullable|string|max:200',
        ]);
    }
}
