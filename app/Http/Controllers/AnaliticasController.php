<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\Analytics\AnalyticsService;
use Inertia\Inertia;

class AnaliticasController extends Controller
{
    public function __construct(
        private readonly AnalyticsService $analyticsService
    ) {}

    public function index()
    {
        $metrics = $this->analyticsService->getDashboardMetrics();
        return Inertia::render('Admin/Analiticas/Index', $metrics);
    }
}
