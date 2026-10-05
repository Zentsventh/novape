<?php

namespace App\Domain\Dashboard\Controllers;

use App\Domain\Dashboard\Services\DashboardService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * GET /api/v1/dashboard/summary?from=2023-01-01&to=2023-01-31
     */
    public function summary(Request $request)
    {
        $from = $request->query('from') ? \Carbon\Carbon::parse($request->query('from')) : now()->subMonth();
        $to   = $request->query('to')   ? \Carbon\Carbon::parse($request->query('to'))   : now();
        $prevFrom = $from->copy()->subMonths($from->diffInMonths($to));
        $prevTo   = $to->copy()->subMonths($from->diffInMonths($to));

        return response()->json([
            'sales'          => $this->dashboardService->salesSummary($from, $to),
            'profitability' => $this->dashboardService->profitability($from, $to),
            'orders_by_status'=> $this->dashboardService->ordersByStatus($from, $to),
            'average_ticket' => $this->dashboardService->averageTicket($from, $to),
            'customers'      => $this->dashboardService->customersGrowth($from, $to),
            'compare'        => $this->dashboardService->comparePeriod($from, $to, $prevFrom, $prevTo),
        ]);
    }
}
