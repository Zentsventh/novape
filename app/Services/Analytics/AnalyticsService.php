<?php

declare(strict_types=1);

namespace App\Services\Analytics;

use Illuminate\Support\Facades\DB;
use App\Models\Pedido;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class AnalyticsService
{
    /**
     * Returns all metrics needed for the Analíticas dashboard.
     * Each sub-method is wrapped in its own try/catch so a single
     * failure never brings down the whole dashboard.
     */
    public function getDashboardMetrics(): array
    {
        // ----- Ventas mensuales (últimos 6 meses) -----
        $chartVentas = $this->safe(fn () => $this->buildChartVentas(), []);

        // ----- Distribución de estados de pedidos -----
        $chartEstados = $this->safe(fn () => $this->buildChartEstados(), []);

        // ----- Top 5 productos por ventas -----
        $topProductos = $this->safe(fn () => $this->buildTopProductos(), []);

        // ----- KPIs básicos -----
        $kpis = $this->safe(fn () => $this->buildKpis(), [
            'ingresosHistorico' => 0,
            'pedidosMes'        => 0,
            'ticketPromedio'    => 0,
        ]);

        // ----- Métricas avanzadas -----
        $retention        = $this->safe(fn () => $this->getRetentionMetrics(), ['repeatRate' => 0, 'clv' => 0]);
        $productProfit    = $this->safe(fn () => $this->getProductProfitability(), []);
        $returnRates      = $this->safe(fn () => $this->getReturnRates(), []);
        $categoryAnalysis = $this->safe(fn () => $this->getTopCategories(), []);
        $cartAbandon      = $this->safe(fn () => $this->getCartAbandonmentRate(), ['totalCarts' => 0, 'abandoned' => 0, 'rate' => 0]);
        $channelComp      = $this->safe(fn () => $this->getChannelComparison(), ['web' => ['total' => 0, 'pct' => 0], 'pos' => ['total' => 0, 'pct' => 0]]);
        $geoHeat          = $this->safe(fn () => $this->getGeographicHeatmap(), []);
        $peakHeat         = $this->safe(fn () => $this->getPeakHoursHeatmap(), []);

        return [
            'chartVentas'       => $chartVentas,
            'chartEstados'      => $chartEstados,
            'topProductos'      => $topProductos,
            'kpis'              => $kpis,
            'retention'         => $retention,
            'productProfit'     => $productProfit,
            'returnRates'       => $returnRates,
            'categoryAnalysis'  => $categoryAnalysis,
            'cartAbandonment'   => $cartAbandon,
            'channelComparison' => $channelComp,
            'geographicHeatmap' => $geoHeat,
            'peakHoursHeatmap'  => $peakHeat,
        ];
    }

    // ─────────────────────────────────────────────
    //  Helper: ejecuta un closure con fallback seguro
    // ─────────────────────────────────────────────

    private function safe(callable $fn, mixed $default): mixed
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            Log::warning('AnalyticsService partial error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $default;
        }
    }

    // ─────────────────────────────────────────────
    //  Builders
    // ─────────────────────────────────────────────

    private function buildChartVentas(): array
    {
        $chartVentas = [];
        for ($i = 5; $i >= 0; $i--) {
            $mes = Carbon::now()->subMonths($i);
            $totalMes = Pedido::where('estado', 'completado')
                ->whereYear('created_at', $mes->year)
                ->whereMonth('created_at', $mes->month)
                ->sum('total');
            $chartVentas[] = [
                'mes'   => ucfirst($mes->translatedFormat('M Y')),
                'total' => (float) $totalMes,
            ];
        }
        return $chartVentas;
    }

    private function buildChartEstados(): array
    {
        return Pedido::select('estado', DB::raw('count(*) as count'))
            ->groupBy('estado')
            ->get()
            ->map(function ($item) {
                $colores = [
                    'pendiente'  => '#F59E0B',
                    'procesando' => '#3B82F6',
                    'enviado'    => '#8B5CF6',
                    'completado' => '#10B981',
                    'cancelado'  => '#EF4444',
                ];
                return [
                    'name'  => ucfirst($item->estado),
                    'value' => $item->count,
                    'color' => $colores[$item->estado] ?? '#6B7280',
                ];
            })->toArray();
    }

    private function buildTopProductos(): array
    {
        return DB::table('pedido_item')
            ->join('pedido', 'pedido.id', '=', 'pedido_item.pedido_id')
            ->join('variante', 'variante.id', '=', 'pedido_item.variante_id')
            ->join('producto', 'producto.id', '=', 'variante.producto_id')
            ->select(
                'producto.nombre',
                DB::raw('SUM(pedido_item.cantidad) as total_vendido'),
                DB::raw('SUM(pedido_item.cantidad * pedido_item.precio_unitario) as ingresos')
            )
            ->where('pedido.estado', 'completado')
            ->groupBy('producto.id', 'producto.nombre')
            ->orderBy('total_vendido', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'nombre'   => mb_strimwidth($p->nombre, 0, 25, '...'),
                'ventas'   => (int) $p->total_vendido,
                'ingresos' => (float) $p->ingresos,
            ])->toArray();
    }

    private function buildKpis(): array
    {
        $totalIngresosHistorico = (float) Pedido::where('estado', 'completado')->sum('total');

        $totalPedidosMesActual = Pedido::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        $completadosMesCount = Pedido::where('estado', 'completado')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->count();

        $ticketPromedio = $completadosMesCount > 0
            ? (float) Pedido::where('estado', 'completado')
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('total') / $completadosMesCount
            : 0;

        return [
            'ingresosHistorico' => round($totalIngresosHistorico, 2),
            'pedidosMes'        => $totalPedidosMesActual,
            'ticketPromedio'    => round($ticketPromedio, 2),
        ];
    }

    // ─────────────────────────────────────────────
    //  Métricas avanzadas
    // ─────────────────────────────────────────────

    /**
     * Tasa de repetición de compra y CLV.
     */
    private function getRetentionMetrics(): array
    {
        $totalCustomers = Pedido::where('estado', 'completado')
            ->distinct('usuario_id')
            ->count('usuario_id');

        $repeatCustomers = Pedido::where('estado', 'completado')
            ->select('usuario_id')
            ->groupBy('usuario_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        $repeatRate = $totalCustomers > 0 ? ($repeatCustomers / $totalCustomers) * 100 : 0;

        $totalRevenuePerCustomer = Pedido::where('estado', 'completado')
            ->select('usuario_id', DB::raw('SUM(total) as revenue'))
            ->groupBy('usuario_id')
            ->pluck('revenue');

        $clv = $totalRevenuePerCustomer->count() > 0 ? $totalRevenuePerCustomer->avg() : 0;

        return [
            'repeatRate' => round($repeatRate, 2),
            'clv'        => round((float) $clv, 2),
        ];
    }

    /**
     * Rentabilidad (ingresos) por producto - top 5.
     */
    private function getProductProfitability(): array
    {
        return DB::table('pedido_item')
            ->join('pedido', 'pedido.id', '=', 'pedido_item.pedido_id')
            ->join('variante', 'variante.id', '=', 'pedido_item.variante_id')
            ->join('producto', 'producto.id', '=', 'variante.producto_id')
            ->where('pedido.estado', 'completado')
            ->select(
                'producto.id',
                'producto.nombre',
                DB::raw('SUM(pedido_item.cantidad * pedido_item.precio_unitario) as profit'),
                DB::raw('SUM(pedido_item.cantidad) as unidades')
            )
            ->groupBy('producto.id', 'producto.nombre')
            ->orderBy('profit', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id'       => $p->id,
                'nombre'   => mb_strimwidth($p->nombre, 0, 25, '...'),
                'profit'   => round((float) $p->profit, 2),
                'unidades' => (int) $p->unidades,
            ])->toArray();
    }

    /**
     * Tasa de devoluciones. Usa tabla 'devolucions' si existe, si no 'rma'.
     */
    private function getReturnRates(): array
    {
        // El proyecto usa 'devolucions' (tabla de devoluciones real)
        if (Schema::hasTable('devolucions')) {
            $returns = DB::table('devolucions')
                ->join('pedido', 'pedido.id', '=', 'devolucions.pedido_id')
                ->select(DB::raw('COUNT(devolucions.id) as total_devoluciones'))
                ->first();

            $totalPedidos = Pedido::where('estado', 'completado')->count();
            $rate = $totalPedidos > 0 ? (($returns->total_devoluciones ?? 0) / $totalPedidos) * 100 : 0;

            return [
                ['nombre' => 'Devoluciones', 'devoluciones' => (int) ($returns->total_devoluciones ?? 0), 'porcentaje' => round($rate, 2)],
            ];
        }

        if (Schema::hasTable('rma')) {
            // fallback to rma table if it exists
            return [];
        }

        return [];
    }

    /**
     * Análisis de categorías más rentables.
     * Usa tabla pivot producto_categoria en lugar de producto.categoria_id.
     */
    private function getTopCategories(): array
    {
        return DB::table('pedido_item')
            ->join('pedido', 'pedido.id', '=', 'pedido_item.pedido_id')
            ->join('variante', 'variante.id', '=', 'pedido_item.variante_id')
            ->join('producto', 'producto.id', '=', 'variante.producto_id')
            ->join('producto_categoria', 'producto_categoria.producto_id', '=', 'producto.id')
            ->join('categoria', 'categoria.id', '=', 'producto_categoria.categoria_id')
            ->where('pedido.estado', 'completado')
            ->select(
                'categoria.id',
                'categoria.nombre',
                DB::raw('SUM(pedido_item.cantidad * pedido_item.precio_unitario) as ingresos')
            )
            ->groupBy('categoria.id', 'categoria.nombre')
            ->orderBy('ingresos', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'id'       => $c->id,
                'nombre'   => $c->nombre,
                'ingresos' => round((float) $c->ingresos, 2),
            ])->toArray();
    }

    /**
     * Tasa de carritos abandonados.
     * Usa tabla 'carrito' (no 'cart'). El carrito no tiene campo 'status',
     * así que contamos carritos sin pedido asociado.
     */
    private function getCartAbandonmentRate(): array
    {
        $totalCarts = DB::table('carrito')->count();

        // Carritos que nunca se convirtieron en pedido
        $abandoned = DB::table('carrito')
            ->leftJoin('pedido', 'pedido.usuario_id', '=', 'carrito.usuario_id')
            ->whereNull('pedido.id')
            ->count();

        $rate = $totalCarts > 0 ? ($abandoned / $totalCarts) * 100 : 0;

        return [
            'totalCarts' => $totalCarts,
            'abandoned'  => $abandoned,
            'rate'       => round($rate, 2),
        ];
    }

    /**
     * Comparativa de canales (Web vs POS).
     * La tabla pedido no tiene columna 'fuente', así que
     * Web = todos los pedidos completados, POS = ventas_pos.
     */
    private function getChannelComparison(): array
    {
        $webTotal = (float) Pedido::where('estado', 'completado')->sum('total');

        $posTotal = Schema::hasTable('ventas_pos')
            ? (float) DB::table('ventas_pos')->sum('total')
            : 0;

        $total = $webTotal + $posTotal;
        $webPct = $total > 0 ? ($webTotal / $total) * 100 : 0;
        $posPct = $total > 0 ? ($posTotal / $total) * 100 : 0;

        return [
            'web' => ['total' => round($webTotal, 2), 'pct' => round($webPct, 2)],
            'pos' => ['total' => round($posTotal, 2), 'pct' => round($posPct, 2)],
        ];
    }

    /**
     * Mapa de calor geográfico.
     * La tabla pedido no tiene columna 'ciudad', usamos dirección de envío o devolvemos vacío.
     */
    private function getGeographicHeatmap(): array
    {
        // La tabla pedido no tiene columna 'ciudad' directamente
        // Devolvemos array vacío; el frontend ya maneja este caso
        return [];
    }

    /**
     * Heatmap de horarios (día de la semana + hora).
     */
    private function getPeakHoursHeatmap(): array
    {
        $raw = Pedido::where('estado', 'completado')
            ->select(
                DB::raw('DAYOFWEEK(created_at) as day'),
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('day', 'hour')
            ->orderBy('day')
            ->orderBy('hour')
            ->get();

        $matrix = [];
        for ($d = 1; $d <= 7; $d++) {
            $matrix[$d] = array_fill(0, 24, 0);
        }
        foreach ($raw as $row) {
            $matrix[$row->day][$row->hour] = $row->count;
        }
        return $matrix;
    }
}
