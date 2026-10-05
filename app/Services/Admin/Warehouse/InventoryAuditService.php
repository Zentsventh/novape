<?php

declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryAuditService
{
    public function getDashboardData(): array
    {
        $ventasPorVariante = DB::query()
            ->fromSub(function($query) {
                $query->select('variante_id', 'cantidad')
                      ->from('venta_pos_items')
                      ->unionAll(
                          DB::table('pedido_item')
                            ->join('pedido', 'pedido.id', '=', 'pedido_item.pedido_id')
                            ->where('pedido.estado', 'completado')
                            ->select('variante_id', 'cantidad')
                      );
            }, 'ventas_combinadas')
            ->selectRaw('variante_id, SUM(cantidad) as total_vendido')
            ->groupBy('variante_id')
            ->pluck('total_vendido', 'variante_id');

        $comprasPorVariante = DB::table('compra_items')
            ->join('compras', 'compra_items.compra_id', '=', 'compras.id')
            ->where('compras.estado', 'completado')
            ->selectRaw('variante_id, SUM(compra_items.cantidad) as total_comprado')
            ->groupBy('variante_id')
            ->pluck('total_comprado', 'variante_id');

        $demandaRaw = DB::query()
            ->fromSub(function($query) {
                $query->select('variante_id', DB::raw('DATE(created_at) as fecha'), 'cantidad')
                      ->from('venta_pos_items')
                      ->where('created_at', '>=', Carbon::now()->subDays(15))
                      ->unionAll(
                          DB::table('pedido_item')
                            ->join('pedido', 'pedido.id', '=', 'pedido_item.pedido_id')
                            ->where('pedido.estado', 'completado')
                            ->where('pedido_item.created_at', '>=', Carbon::now()->subDays(15))
                            ->select('variante_id', DB::raw('DATE(pedido_item.created_at) as fecha'), 'cantidad')
                      );
            }, 'demanda_combinada')
            ->selectRaw('variante_id, fecha, SUM(cantidad) as cantidad')
            ->groupBy('variante_id', 'fecha')
            ->get();

        $categoryIds = DB::table('producto_categoria as pc')
            ->join('categoria as c', 'c.id', '=', 'pc.categoria_id')
            ->where('c.activa', true)->whereNull('c.deleted_at')
            ->selectRaw('pc.producto_id, COALESCE(MIN(CASE WHEN c.categoria_padre_id IS NULL THEN c.id END), MIN(c.id)) as categoria_id')
            ->groupBy('pc.producto_id');
        // Keep the dashboard payload small: product descriptions and full category trees are not used here.
        $productos = DB::table('variante as v')->join('producto as p', 'p.id', '=', 'v.producto_id')
            ->leftJoin('marca as m', function ($join) { $join->on('m.id', '=', 'p.marca_id')->whereNull('m.deleted_at'); })
            ->leftJoinSub($categoryIds, 'primary_category', 'primary_category.producto_id', '=', 'p.id')
            ->leftJoin('categoria as c', 'c.id', '=', 'primary_category.categoria_id')
            ->where('p.activo', true)->whereNull('p.deleted_at')->whereNull('v.deleted_at')
            ->select(['v.id', 'v.sku', 'v.stock', 'v.precio', 'v.precio_compra', 'v.stock_minimo', 'v.stock_maximo', 'v.stock_seguridad',
                'p.id as producto_id', 'p.nombre as producto_nombre', 'c.id as categoria_id', 'c.nombre as categoria', 'm.id as marca_id', 'm.nombre as marca'])
            ->orderBy('v.id')
            ->get()
            ->map(function($v) use ($ventasPorVariante, $comprasPorVariante) {
                return [
                    'id' => $v->id,
                    'producto_nombre' => $v->producto_nombre,
                    'producto_id' => $v->producto_id,
                    'sku' => $v->sku,
                    'stock' => $v->stock,
                    'precio' => $v->precio,
                    'precio_compra' => $v->precio_compra,
                    'stock_minimo' => $v->stock_minimo,
                    'stock_maximo' => $v->stock_maximo,
                    'stock_seguridad' => $v->stock_seguridad,
                    'categoria' => $v->categoria ?? 'Sin Categoría',
                    'categoria_id' => $v->categoria_id,
                    'marca' => $v->marca ?? 'Sin Marca',
                    'marca_id' => $v->marca_id,
                    'unidades_vendidas' => $ventasPorVariante->get($v->id, 0),
                    'unidades_compradas' => $comprasPorVariante->get($v->id, 0),
                ];
            });

        $categorias = DB::table('categoria')
            ->where('activa', true)
            ->whereNull('deleted_at')
            ->whereNull('categoria_padre_id')
            ->select('id', 'nombre')
            ->orderBy('nombre')
            ->get();

        return compact('productos', 'categorias', 'demandaRaw');
    }
}
