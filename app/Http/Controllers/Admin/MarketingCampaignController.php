<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Usuario;

class MarketingCampaignController extends Controller
{
    public function index()
    {
        // Simple mock of campaigns for the Marketing Cloud foundation
        $campaigns = [
            [
                'id' => 1,
                'name' => 'Black Friday 2026',
                'type' => 'Email',
                'status' => 'Programado',
                'audience_size' => 1500,
                'sent' => 0,
                'open_rate' => 0,
                'roi' => 0,
                'created_at' => now()->subDays(2)->toDateTimeString()
            ],
            [
                'id' => 2,
                'name' => 'Recuperación de Carrito - Sep',
                'type' => 'WhatsApp',
                'status' => 'Activo',
                'audience_size' => 320,
                'sent' => 120,
                'open_rate' => 85,
                'roi' => 1250.00,
                'created_at' => now()->subDays(5)->toDateTimeString()
            ],
            [
                'id' => 3,
                'name' => 'Newsletter VIP',
                'type' => 'Email',
                'status' => 'Completado',
                'audience_size' => 500,
                'sent' => 500,
                'open_rate' => 45,
                'roi' => 3400.00,
                'created_at' => now()->subDays(15)->toDateTimeString()
            ]
        ];

        // Segmentación base RFM
        $stats = [
            'total_audience' => Usuario::whereHas('roles', fn($q) => $q->where('nombre', 'cliente'))->count(),
            'vip_customers' => Usuario::where('total_orders', '>=', 5)->count(),
            'at_risk' => Usuario::where('last_order_date', '<', now()->subDays(90))->count(),
        ];

        return Inertia::render('Admin/Marketing/Index', [
            'campaigns' => $campaigns,
            'stats' => $stats
        ]);
    }
}
