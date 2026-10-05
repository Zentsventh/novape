<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendMarketingCampaignJob;
use App\Models\MarketingCampaign;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
                'roi' => null,
                'created_at' => $c->created_at->format('Y-m-d H:i'),
            ];
        });

        // Segmentación base RFM
        $stats = [
            'total_audience' => Usuario::whereHas('roles', fn ($q) => $q->where('nombre', 'cliente'))->count(),
            'vip_customers' => $this->calculateAudienceSize('vip'),
            'at_risk' => $this->calculateAudienceSize('at_risk'),
        ];

        return Inertia::render('Admin/Marketing/Index', [
            'campaigns' => $campaigns,
            'stats' => $stats,
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
        if (in_array(config('mail.default'), ['log', 'array'], true)) {
            return redirect()->back()->with('error', 'Configura un proveedor de correo antes de enviar campañas.');
        }
        $updated = MarketingCampaign::where('id', $campaign->id)->where('status', 'draft')
            ->update(['status' => 'sending', 'started_at' => now()]);
        if (! $updated) {
            return redirect()->back()->with('error', 'Esta campaña ya no es un borrador.');
        }

        try {
            SendMarketingCampaignJob::dispatch($campaign->fresh());
        } catch (\Throwable $e) {
            $campaign->update(['status' => 'failed']);
            report($e);

            return redirect()->back()->with('error', 'No se pudo encolar el envío. Revisa la configuración de la cola.');
        }

        return redirect()->route('admin.marketing.campaigns')->with('success', 'Campaña encolada para envío.');
    }

    private function calculateAudienceSize(string $segment): int
    {
        $query = Usuario::where('estado', 'activo')->whereNotNull('email')
            ->whereHas('roles', fn ($q) => $q->where('nombre', 'cliente'));

        return match ($segment) {
            'vip' => $query->where('total_orders', '>=', 5)->count(),
            'at_risk' => $query->where('last_order_date', '<', now()->subDays(90))->count(),
            default => $query->count(),
        };
    }
}
