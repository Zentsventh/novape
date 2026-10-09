<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CalculateRfm extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:calculate-rfm';

    protected $description = 'Calculate RFM and Lead Scoring segments for all customers based on order history';

    public function handle()
    {
        $this->info('Starting RFM calculation...');

        $usuarios = \App\Models\Usuario::with(['pedidos' => function($q) {
            \App\Services\Operations\ReportDataset::apply($q, 'pedido');
            $q->whereRaw('LOWER(estado) IN (?, ?, ?, ?)', \App\Services\Orders\OrderTransitions::REVENUE_STATES);
        }])->get();

        $posByUser = collect();
        if (\Illuminate\Support\Facades\Schema::hasColumn('clientes', 'usuario_id')) {
            $posByUser = \App\Services\Operations\ReportDataset::apply(\Illuminate\Support\Facades\DB::table('ventas_pos as sales')->join('clientes as client', 'client.id', '=', 'sales.cliente_id'), 'ventas_pos', 'sales')
                ->whereNotNull('client.usuario_id')->selectRaw('client.usuario_id, COUNT(*) as frequency, SUM(sales.total) as amount, MAX(sales.created_at) as last_sale')->groupBy('client.usuario_id')->get()->keyBy('usuario_id');
        }

        $now = now();
        $count = 0;

        foreach ($usuarios as $usuario) {
            $pedidos = $usuario->pedidos;
            $pos = $posByUser->get($usuario->id);
            
            if ($pedidos->count() === 0 && !$pos) {
                // If they have no completed orders, they are just "Nuevo" or "Prospecto"
                $usuario->update([
                    'rfm_score' => null,
                    'ltv' => 0,
                    'total_orders' => 0,
                    'last_order_date' => null,
                    'segmento' => 'Nuevo'
                ]);
                continue;
            }

            // Calculate Base Metrics
            $lastOrder = $pedidos->sortByDesc('created_at')->first();
            $lastDate = $lastOrder?->created_at;
            if ($pos && (!$lastDate || \Carbon\Carbon::parse($pos->last_sale)->greaterThan($lastDate))) $lastDate = \Carbon\Carbon::parse($pos->last_sale);
            $recencyDays = max(0, $lastDate->diffInDays($now, false));
            $frequency = $pedidos->count() + (int) ($pos->frequency ?? 0);
            $refunded = (float) \Illuminate\Support\Facades\DB::table('refund_requests')->whereIn('pedido_id', $pedidos->pluck('id'))->where('status', 'confirmed')->sum('amount');
            $monetary = max(0, (float) $pedidos->sum('total') + (float) ($pos->amount ?? 0) - $refunded);

            // 1. Recency Score (1-5, 5 is best/most recent)
            // Example: < 30 days = 5, < 90 = 4, < 180 = 3, < 365 = 2, > 365 = 1
            $rScore = 1;
            if ($recencyDays <= 30) $rScore = 5;
            elseif ($recencyDays <= 90) $rScore = 4;
            elseif ($recencyDays <= 180) $rScore = 3;
            elseif ($recencyDays <= 365) $rScore = 2;

            // 2. Frequency Score (1-5, 5 is best)
            // Example: > 10 orders = 5, > 5 = 4, > 2 = 3, = 2 = 2, = 1 = 1
            $fScore = 1;
            if ($frequency >= 10) $fScore = 5;
            elseif ($frequency >= 5) $fScore = 4;
            elseif ($frequency > 2) $fScore = 3;
            elseif ($frequency == 2) $fScore = 2;

            // 3. Monetary Score (1-5, 5 is best)
            // Example: > $5000 = 5, > $2000 = 4, > $500 = 3, > $100 = 2, <= $100 = 1
            $mScore = 1;
            if ($monetary >= 5000) $mScore = 5;
            elseif ($monetary >= 2000) $mScore = 4;
            elseif ($monetary >= 500) $mScore = 3;
            elseif ($monetary >= 100) $mScore = 2;

            $rfmScore = "{$rScore}{$fScore}{$mScore}";

            // Determine Segment based on RFM logic
            // (111 to 555)
            $segmento = 'Regular';

            if ($rScore == 5 && $fScore == 5 && $mScore == 5) {
                $segmento = 'Campeón';
            } elseif ($rScore >= 4 && $fScore >= 4 && $mScore >= 4) {
                $segmento = 'VIP'; // Compran mucho, frecuente y reciente
            } elseif ($rScore <= 2 && $fScore >= 4 && $mScore >= 4) {
                $segmento = 'En Riesgo'; // Eran muy buenos, pero hace tiempo no compran
            } elseif ($rScore >= 4 && $fScore <= 2) {
                $segmento = 'Potencial'; // Compraron recién, pero poco
            } elseif ($rScore <= 2 && $fScore <= 2) {
                $segmento = 'Perdido'; // Hace mucho no compran y compraban poco
            }

            $usuario->update([
                'rfm_score' => $rfmScore,
                'ltv' => $monetary,
                'last_order_date' => $lastDate,
                'total_orders' => $frequency,
                'segmento' => $segmento
            ]);

            $count++;
        }

        $this->info("Calculated RFM for {$count} users.");
    }
}
