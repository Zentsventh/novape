<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AdminNotification;
use App\Models\Variante;
use App\Models\Producto;
use Illuminate\Console\Command;

class CheckStockAlerts extends Command
{
    protected $signature = 'stock:check-alerts {--threshold=5 : Umbral mínimo de stock}';
    protected $description = 'Verificar productos con stock bajo y generar alertas';

    public function handle(): int
    {
        $threshold = (int) $this->option('threshold');

        // Buscar variantes con stock bajo
        $lowStockVariants = Variante::where('stock', '<=', $threshold)
            ->where('stock', '>=', 0)
            ->with('producto')
            ->get();

        $alertCount = 0;

        foreach ($lowStockVariants as $variante) {
            $productName = $variante->producto->nombre ?? 'Producto #' . $variante->producto_id;
            $sku = $variante->sku ?? 'Sin SKU';

            // Evitar duplicados: no crear alerta si ya existe una sin leer del mismo tipo hoy
            $exists = AdminNotification::where('type', 'stock_bajo')
                ->whereNull('read_at')
                ->whereDate('created_at', today())
                ->whereJsonContains('data->variante_id', $variante->id)
                ->exists();

            if (!$exists) {
                AdminNotification::send('stock_bajo', "Stock bajo: {$productName}", "SKU: {$sku} — Quedan {$variante->stock} unidades.", [
                    'icon' => 'alert-triangle',
                    'color' => $variante->stock === 0 ? 'red' : 'yellow',
                    'link' => '/admin/inventario',
                    'data' => ['variante_id' => $variante->id, 'stock' => $variante->stock],
                ]);
                $alertCount++;
            }
        }

        $this->info("Se generaron {$alertCount} alertas de stock bajo.");
        return Command::SUCCESS;
    }
}
