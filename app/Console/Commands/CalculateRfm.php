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
            $q->whereIn('estado', ['completado', 'pagado']);
        }])->get();

        $now = now();
        $count = 0;

        foreach ($usuarios as $usuario) {
            $pedidos = $usuario->pedidos;
            
            if ($pedidos->count() === 0) {
                // If they have no completed orders, they are just "Nuevo" or "Prospecto"
                $usuario->update([
                    'rfm_score' => null,
                    'ltv' => 0,
                    'total_orders' => 0,
                    'segmento' => 'Nuevo'
                ]);
                continue;
            }

            // Calculate Base Metrics
            $lastOrder = $pedidos->sortByDesc('created_at')->first();
            $recencyDays = $now->diffInDays($lastOrder->created_at);
            $frequency = $pedidos->count();
            $monetary = $pedidos->sum('total');

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

            if ($rScore >= 4 && $fScore >= 4 && $mScore >= 4) {
                $segmento = 'VIP'; // Compran mucho, frecuente y reciente
            } elseif ($rScore <= 2 && $fScore >= 4 && $mScore >= 4) {
                $segmento = 'En Riesgo'; // Eran muy buenos, pero hace tiempo no compran
            } elseif ($rScore >= 4 && $fScore <= 2) {
                $segmento = 'Potencial'; // Compraron recién, pero poco
            } elseif ($rScore <= 2 && $fScore <= 2) {
                $segmento = 'Perdido'; // Hace mucho no compran y compraban poco
            } elseif ($rScore == 5 && $fScore == 5 && $mScore == 5) {
                $segmento = 'Campeón'; // El mejor de todos
            }

            $usuario->update([
                'rfm_score' => $rfmScore,
                'ltv' => $monetary,
                'last_order_date' => $lastOrder->created_at,
                'total_orders' => $frequency,
                'segmento' => $segmento
            ]);

            $count++;
        }

        $this->info("Calculated RFM for {$count} users.");
    }
}
