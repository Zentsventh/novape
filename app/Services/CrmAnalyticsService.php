<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CrmDeal;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

class CrmAnalyticsService
{
    public function getDashboardMetrics(): array
    {
        return [
            'kpis' => $this->getKpis(),
            'funnel' => $this->getFunnelData(),
            'monthly_sales' => $this->getMonthlySalesData(),
            'scatter_data' => $this->getScatterData(),
            'pipeline_forecast' => $this->getPipelineForecast(),
            'win_loss_ratio' => $this->getWinLossRatio(),
            'leaderboard' => $this->getLeaderboard(),
            'top_deals' => $this->getTopDeals(),
        ];
    }

    private function getKpis(): array
    {
        $totalDeals = CrmDeal::count();
        $wonDeals = CrmDeal::where('estado', 'won')->count();
        
        $winRate = $totalDeals > 0 ? round(($wonDeals / $totalDeals) * 100, 2) : 0;
        
        $totalRevenue = CrmDeal::where('estado', 'won')->sum('valor');
        
        $activeCustomers = Usuario::whereHas('pedidos')->count();
        $ltv = $activeCustomers > 0 ? round($totalRevenue / $activeCustomers, 2) : 0;

        $dealVelocity = CrmDeal::where('estado', 'won')
            ->select(DB::raw('AVG(DATEDIFF(updated_at, created_at)) as avg_days'))
            ->value('avg_days');

        return [
            'total_deals' => $totalDeals,
            'win_rate' => $winRate,
            'total_revenue' => $totalRevenue,
            'avg_ltv' => $ltv,
            'deal_velocity' => round((float) $dealVelocity, 1),
        ];
    }

    private function getFunnelData(): array
    {
        return DB::table('crm_deals')
            ->join('crm_stages', 'crm_deals.stage_id', '=', 'crm_stages.id')
            ->select('crm_stages.nombre as name', DB::raw('count(crm_deals.id) as value'), 'crm_stages.color')
            ->groupBy('crm_stages.id', 'crm_stages.nombre', 'crm_stages.color')
            ->orderBy('crm_stages.orden')
            ->get()
            ->toArray();
    }

    private function getMonthlySalesData(): array
    {
        return DB::table('crm_deals')
            ->where('estado', 'won')
            ->where('updated_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw('DATE_FORMAT(updated_at, "%Y-%m") as month'),
                DB::raw('SUM(valor) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->month,
                    'Ventas' => (float) $item->total,
                ];
            })
            ->toArray();
    }

    private function getScatterData(): array
    {
        return DB::table('crm_deals')
            ->where('estado', 'won')
            ->select(
                DB::raw('DATEDIFF(updated_at, created_at) as dias_cierre'),
                'valor'
            )
            ->get()
            ->map(function ($item) {
                return [
                    'x' => (int) $item->dias_cierre,
                    'y' => (float) $item->valor,
                    'z' => 1
                ];
            })
            ->toArray();
    }

    private function getPipelineForecast(): array
    {
        $data = DB::table('crm_deals')
            ->where('updated_at', '>=', now()->subMonths(6))
            ->select(
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                'estado',
                DB::raw('COUNT(id) as total')
            )
            ->groupBy('month', 'estado')
            ->orderBy('month')
            ->get();

        $forecast = [];
        foreach ($data as $row) {
            if (!isset($forecast[$row->month])) {
                $forecast[$row->month] = ['name' => $row->month, 'won' => 0, 'lost' => 0, 'open' => 0];
            }
            $forecast[$row->month][$row->estado] = (int) $row->total;
        }

        return array_values($forecast);
    }

    private function getWinLossRatio(): array
    {
        $stats = DB::table('crm_deals')
            ->select('estado', DB::raw('count(id) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();

        return [
            ['name' => 'Ganados', 'value' => (int) ($stats['won'] ?? 0), 'color' => '#1e3a8a'],
            ['name' => 'Perdidos', 'value' => (int) ($stats['lost'] ?? 0), 'color' => '#60a5fa'],
            ['name' => 'Abiertos', 'value' => (int) ($stats['open'] ?? 0), 'color' => '#2563eb'],
        ];
    }

    private function getLeaderboard(): array
    {
        // Attribute each won deal once to its first recorded activity author.
        $authors = DB::table('crm_activities')
            ->whereNotNull('usuario_id')
            ->selectRaw('deal_id, MIN(id) as first_activity_id')
            ->groupBy('deal_id');

        return DB::table('crm_deals')
            ->joinSub($authors, 'authors', fn ($join) => $join->on('authors.deal_id', '=', 'crm_deals.id'))
            ->join('crm_activities', 'crm_activities.id', '=', 'authors.first_activity_id')
            ->join('usuario', 'usuario.id', '=', 'crm_activities.usuario_id')
            ->where('crm_deals.estado', 'won')
            ->select('usuario.nombres', 'usuario.apellidos')
            ->selectRaw('SUM(crm_deals.valor) AS total_ventas, COUNT(crm_deals.id) AS deals_cerrados')
            ->groupBy('usuario.id', 'usuario.nombres', 'usuario.apellidos')
            ->orderByDesc('total_ventas')
            ->limit(10)
            ->get()
            ->map(fn ($row) => ['vendedor' => trim($row->nombres.' '.$row->apellidos), 'total_ventas' => (float) $row->total_ventas, 'deals_cerrados' => (int) $row->deals_cerrados])
            ->all();
    }

    private function getTopDeals(): array
    {
        return CrmDeal::with(['cliente', 'stage'])
            ->where('estado', 'open')
            ->orderByDesc('valor')
            ->limit(5)
            ->get()
            ->toArray();
    }
}
