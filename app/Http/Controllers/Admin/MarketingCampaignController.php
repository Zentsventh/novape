<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Usuario;
use App\Models\MarketingCampaign;

class MarketingCampaignController extends Controller
{
    public function index()
    {
        $campaigns = MarketingCampaign::orderBy('created_at', 'desc')->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'type' => 'Email', // Default for now
                'status' => ucfirst($c->status),
                'audience_size' => $c->target_count,
                'sent' => $c->sent_count,
                'open_rate' => $c->sent_count > 0 ? round(($c->opened_count / $c->sent_count) * 100) : 0,
                'roi' => 0, // Placeholder
                'created_at' => $c->created_at->format('Y-m-d H:i')
            ];
        });

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

    public function create()
    {
        return Inertia::render('Admin/Marketing/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'segment' => 'required|string|in:all,vip,at_risk',
            'content' => 'required|string',
        ]);

        $campaign = MarketingCampaign::create([
            'name' => $validated['name'],
            'subject' => $validated['subject'],
            'segment' => $validated['segment'],
            'content' => $validated['content'],
            'status' => 'draft',
            'author_id' => auth()->id() ?? 1,
            'target_count' => $this->calculateAudienceSize($validated['segment']),
        ]);

        return redirect()->route('admin.marketing.campaigns')->with('success', 'Campaña creada como borrador.');
    }

    public function send(MarketingCampaign $campaign)
    {
        if ($campaign->status !== 'draft') {
            return redirect()->back()->with('error', 'Esta campaña ya no es un borrador.');
        }

        $campaign->update(['status' => 'sending', 'started_at' => now()]);
        
        \App\Jobs\SendMarketingCampaignJob::dispatch($campaign);

        return redirect()->route('admin.marketing.campaigns')->with('success', 'Campaña encolada para envío.');
    }

    private function calculateAudienceSize(string $segment): int
    {
        return match($segment) {
            'vip' => Usuario::where('total_orders', '>=', 5)->count(),
            'at_risk' => Usuario::where('last_order_date', '<', now()->subDays(90))->count(),
            default => Usuario::whereHas('roles', fn($q) => $q->where('nombre', 'cliente'))->count(),
        };
    }
}
