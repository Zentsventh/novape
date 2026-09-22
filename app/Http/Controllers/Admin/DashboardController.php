<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\Dashboard\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analyticsService
    ) {}

    public function dashboard(Request $request)
    {
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
                'q' => $q
            ]
        ]));
    }

    public function globalSearch(Request $request)
    {
        $q = (string) $request->query('q', '');
        if (!$q) {
            return response()->json(['productos' => [], 'pedidos' => [], 'usuarios' => []]);
        }

        return response()->json($this->analyticsService->searchGlobal($q, auth()->user()));
    }

    public function exportarPdf(Request $request)
    {
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());
        $status = $request->query('status');
        $q = $request->query('q');

        $stats = $this->analyticsService->getDashboardStats($startDate, $endDate, 'created_at', 'desc', $status, $q);

        $logoUrl = ConfiguracionSitio::obtener('logo_url');
        $logoBase64 = null;
        if ($logoUrl) {
            $logoPath = storage_path('app/public/' . str_replace('public/', '', $logoUrl));
            if (!file_exists($logoPath)) {
                $logoPath = public_path('images/logofactura.png');
            }
            if (file_exists($logoPath)) {
                $logoBase64 = 'data:' . mime_content_type($logoPath) . ';base64,' . base64_encode(file_get_contents($logoPath));
            }
        }

        $data = [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'ventasWeb' => $stats['ventasTotal'] - \Illuminate\Support\Facades\DB::table('ventas_pos')->sum('total'), // Simplified for export view
            'ventasPos' => \Illuminate\Support\Facades\DB::table('ventas_pos')->sum('total'),
            'ventasTotal' => $stats['ventasTotal'],
            'costosTotal' => $stats['costosTotal'],
            'gananciaNeta' => $stats['gananciaNeta'],
            'pedidosCount' => $stats['totalPedidos'],
            'pedidos' => $stats['pedidosRecientes'],
            'logoBase64' => $logoBase64,
            'stockBajo' => array_slice($this->analyticsService->getLowStock(8), 0, 8),
            'topProductosVendidos' => $this->analyticsService->getTopProducts($startDate, $endDate)
        ];

        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.dashboard', $data)
            ->setPaper('A4', 'portrait')
            ->download('reporte_dashboard_' . date('Y-m-d') . '.pdf');
    }
    public function exportarExcel(Request $request)
    {
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
            'topProductosVendidos' => $this->analyticsService->getTopProducts($startDate, $endDate)
        ];

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\DashboardExport($data), 
            'reporte_dashboard_' . date('Y-m-d') . '.xlsx'
        );
    }
}
