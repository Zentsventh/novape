<?php
namespace App\Services\Admin\Dashboard;

use App\Services\Operations\ReportDataset;
use App\Services\Orders\OrderTransitions;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class CommercialMarginService
{
    public function summary(string $start, string $end): array
    {
        $result = ['ventasNetas' => 0, 'reembolsos' => 0, 'costoVendido' => 0, 'partidasSinCosto' => 0, 'margenComercial' => null,
            'criterio' => 'Cohorte de ventas del período, reembolsos confirmados hasta su cierre; importes registrados. No equivale a utilidad contable.'];
        if (!Schema::hasTable('pedido_item') || !Schema::hasColumn('pedido_item', 'costo_unitario')) return $result;
        $orders = ReportDataset::apply(DB::table('pedido'), 'pedido')->whereIn('estado', array_merge(OrderTransitions::REVENUE_STATES, array_map('ucfirst', OrderTransitions::REVENUE_STATES)))
            ->where('created_at', '>=', Carbon::parse($start)->startOfDay())->where('created_at', '<', Carbon::parse($end)->addDay()->startOfDay());
        $pos = ReportDataset::apply(DB::table('ventas_pos'), 'ventas_pos')
            ->where('created_at', '>=', Carbon::parse($start)->startOfDay())->where('created_at', '<', Carbon::parse($end)->addDay()->startOfDay());
        $webItems = DB::table('pedido_item')->whereIn('pedido_id', (clone $orders)->select('id'));
        $posItems = DB::table('venta_pos_items')->whereIn('venta_pos_id', (clone $pos)->select('id'));
        $result['partidasSinCosto'] = (clone $webItems)->whereNull('costo_unitario')->count() + (clone $posItems)->whereNull('costo_unitario')->count();
        $refunds = DB::table('refund_requests')->whereIn('pedido_id', (clone $orders)->select('id'))->where('status', 'confirmed')
            ->where('confirmed_at', '<', Carbon::parse($end)->addDay()->startOfDay());
        $result['reembolsos'] = round((float) $refunds->sum('amount'), 2);
        $result['ventasNetas'] = round((float) (clone $orders)->sum('total') + (float) (clone $pos)->sum('total') - $result['reembolsos'], 2);
        $returned = DB::table('inventory_returns')->where('restocked', true)->where('created_at', '<', Carbon::parse($end)->addDay()->startOfDay())
            ->selectRaw('pedido_item_id, SUM(cantidad) as returned_quantity')->groupBy('pedido_item_id');
        $webCost = (clone $webItems)->leftJoinSub($returned, 'returns', 'returns.pedido_item_id', '=', 'pedido_item.id')
            ->selectRaw('COALESCE(SUM((pedido_item.cantidad - COALESCE(returns.returned_quantity, 0)) * costo_unitario), 0) as cost')->value('cost');
        $posCost = (clone $posItems)->selectRaw('COALESCE(SUM(cantidad * costo_unitario), 0) as cost')->value('cost');
        $result['costoVendido'] = round((float) $webCost + (float) $posCost, 2);
        if ($result['partidasSinCosto'] === 0) $result['margenComercial'] = round($result['ventasNetas'] - $result['costoVendido'], 2);
        return $result;
    }
}
