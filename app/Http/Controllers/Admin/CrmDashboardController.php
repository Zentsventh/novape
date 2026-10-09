<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\CrmAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrmDashboardController extends Controller
{
    public function __construct(
        private readonly CrmAnalyticsService $analyticsService
    ) {}

    public function index(Request $request)
    {
        $metrics = $this->analyticsService->getDashboardMetrics();

        return Inertia::render('Admin/CRM/Dashboard', [
            'metrics' => $metrics
        ]);
    }
}
