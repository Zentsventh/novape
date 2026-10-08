<?php
declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

use App\Services\Operations\ReportDataset;
use App\Services\Orders\OrderTransitions;
use Illuminate\Support\Facades\DB;

class InventoryAuditService
{
    public function getDashboardData(array $filters = []): array
    {
        $categories = DB::table('producto_categoria as pc')->join('categoria as c', 'c.id', '=', 'pc.categoria_id')
            ->where('c.activa', true)->whereNull('c.deleted_at')->groupBy('pc.producto_id')
            ->selectRaw('pc.producto_id, COALESCE(MIN(CASE WHEN c.categoria_padre_id IS NULL THEN c.id END), MIN(c.id)) as categoria_id');
        $base = DB::table('variante as v')->join('producto as p', 'p.id', '=', 'v.producto_id')
            ->leftJoinSub($categories, 'category', 'category.producto_id', '=', 'p.id')
            ->leftJoin('categoria as c', 'c.id', '=', 'category.categoria_id')->leftJoin('marca as m', 'm.id', '=', 'p.marca_id')
            ->where('p.activo', true)->where('v.activo', true)->whereNull('p.deleted_at')->whereNull('v.deleted_at');
        foreach (['categoria_id' => 'c.id', 'marca_id' => 'm.id', 'variante_id' => 'v.id'] as $key => $column) {
            if (!empty($filters[$key])) $base->where($column, $filters[$key]);
        }
        if (!empty($filters['q'])) $base->where(fn ($q) => $q->where('p.nombre', 'like', '%'.$filters['q'].'%')->orWhere('v.sku', 'like', '%'.$filters['q'].'%'));
        $states = array_merge(OrderTransitions::REVENUE_STATES, array_map('ucfirst', OrderTransitions::REVENUE_STATES));
        $web = ReportDataset::apply(DB::table('pedido_item as i')->join('pedido as o', 'o.id', '=', 'i.pedido_id'), 'pedido', 'o')
            ->whereIn('o.estado', $states)->select('i.variante_id', 'i.cantidad', 'o.created_at');
        $pos = ReportDataset::apply(DB::table('venta_pos_items as i')->join('ventas_pos as o', 'o.id', '=', 'i.venta_pos_id'), 'ventas_pos', 'o')
            ->select('i.variante_id', 'i.cantidad', 'o.created_at');
        $sold = DB::query()->fromSub((clone $web)->unionAll(clone $pos), 'sales')->groupBy('variante_id')->selectRaw('variante_id, SUM(cantidad) as sold');
        $purchased = ReportDataset::apply(DB::table('compra_items as i')->join('compras as o', 'o.id', '=', 'i.compra_id'), 'compras', 'o')
            ->where('o.estado', 'completado')->groupBy('i.variante_id')->selectRaw('i.variante_id, SUM(i.cantidad) as purchased');
        $base->leftJoinSub($sold, 'sales', 'sales.variante_id', '=', 'v.id')->leftJoinSub($purchased, 'purchases', 'purchases.variante_id', '=', 'v.id');
        $kpis = (clone $base)->selectRaw('COALESCE(SUM(v.stock), 0) as stock_disponible, COALESCE(SUM(v.stock * v.precio_compra), 0) as costo_total,
            COALESCE(SUM(sales.sold), 0) as unidades_vendidas, COALESCE(SUM(purchases.purchased), 0) as unidades_compradas,
            COALESCE(SUM(v.stock_minimo), 0) as stock_minimo, COALESCE(SUM(v.stock_seguridad), 0) as stock_seguridad,
            COALESCE(SUM(CASE WHEN v.stock_maximo > v.stock THEN v.stock_maximo - v.stock ELSE 0 END), 0) as reposicion')->first();
        $groups = (clone $base)->selectRaw("COALESCE(c.nombre, 'Sin categoría') as nombre, COALESCE(SUM(v.stock), 0) as stock,
            COALESCE(SUM(v.stock * v.precio_compra), 0) as cost, COALESCE(SUM(v.stock_minimo), 0) as minimum")
            ->groupBy('c.id', 'c.nombre')->orderByDesc('stock')->limit(30)->get();
        $variantIds = (clone $base)->select('v.id');
        $demand = DB::query()->fromSub((clone $web)->unionAll(clone $pos), 'sales')
            ->whereIn('variante_id', $variantIds)->where('created_at', '>=', now()->subDays(14)->startOfDay())
            ->selectRaw('DATE(created_at) as fecha, SUM(cantidad) as cantidad')->groupByRaw('DATE(created_at)')->orderBy('fecha')->get();
        $products = (clone $base)->select('v.id', 'v.sku', 'v.stock', 'v.precio', 'v.precio_compra', 'v.stock_minimo', 'v.stock_maximo', 'v.stock_seguridad',
            'p.id as producto_id', 'p.nombre as producto_nombre', 'c.nombre as categoria', 'm.nombre as marca')
            ->selectRaw('COALESCE(sales.sold, 0) as unidades_vendidas, COALESCE(purchases.purchased, 0) as unidades_compradas')
            ->orderBy('v.id')->paginate(50)->withQueryString();
        return ['productos' => $products, 'kpis' => $kpis, 'groups' => $groups, 'demandaRaw' => $demand, 'filters' => $filters,
            'categorias' => DB::table('categoria')->where('activa', true)->whereNull('deleted_at')->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => DB::table('marca')->whereNull('deleted_at')->orderBy('nombre')->get(['id', 'nombre'])];
    }
}
