<?php
declare(strict_types=1);
namespace App\Services\Operations;

use Illuminate\Support\Facades\DB;

final class DatabaseIntegrityService
{
    public function scan(): array
    {
        $checks = [
            'inventory.journal_balance' => ['stock_almacen', DB::table('stock_almacen as s')->leftJoinSub(
                DB::table('inventario_movimientos')->selectRaw('variante_id, almacen_id, SUM(cantidad) as quantity')->groupBy('variante_id', 'almacen_id'),
                'j', fn ($join) => $join->on('j.variante_id', '=', 's.variante_id')->on('j.almacen_id', '=', 's.almacen_id'))
                ->whereRaw('s.cantidad != COALESCE(j.quantity, 0)')->count()],
            'inventory.legacy_reconciliation' => ['movimientos_almacen', DB::table('stock_almacen as s')->leftJoinSub(
                DB::table('movimientos_almacen')->selectRaw("variante_id, almacen_id, SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -ABS(cantidad) END) as quantity")->groupBy('variante_id', 'almacen_id'),
                'j', fn ($join) => $join->on('j.variante_id', '=', 's.variante_id')->on('j.almacen_id', '=', 's.almacen_id'))
                ->whereRaw('s.cantidad != COALESCE(j.quantity, 0)')->count()],
            'catalog.shipping_dimensions' => ['variante', DB::table('variante')->whereNull('deleted_at')->where(fn ($q) => $q->whereNull('shipping_length_cm')->orWhereNull('shipping_width_cm')->orWhereNull('shipping_height_cm')->orWhere('peso', '<=', 0))->count()],
            'catalog.description' => ['producto', DB::table('producto')->where('activo', true)->whereNull('deleted_at')->where(fn ($q) => $q->whereNull('descripcion')->orWhere('descripcion', ''))->count()],
            'catalog.warranty' => ['producto', DB::table('producto')->where('activo', true)->whereNull('deleted_at')->where(fn ($q) => $q->whereNull('garantias')->orWhere('garantias', ''))->count()],
            'history.order_item_snapshots' => ['pedido_item', DB::table('pedido_item')->where(fn ($q) => $q->whereNull('producto_nombre')->orWhereNull('sku')->orWhereNull('costo_unitario')->orWhereNull('almacen_id'))->count()],
            'history.paid_order_stock_evidence' => ['pedido', DB::table('pedido')->whereIn('estado', ['pagado', 'procesando', 'enviado', 'completado'])->whereNull('stock_consumed_at')->count()],
            'pos.payment_ledger' => ['ventas_pos', DB::table('ventas_pos as v')->leftJoinSub(DB::table('venta_pos_pagos')->selectRaw('venta_pos_id, SUM(monto) as paid')->groupBy('venta_pos_id'), 'p', 'p.venta_pos_id', '=', 'v.id')->whereRaw('ABS(v.total - COALESCE(p.paid, 0)) > 0.01')->count()],
        ];
        $rows = [];
        foreach ($checks as $key => [$table, $count]) {
            $rows[] = ['issue_key' => $key, 'category' => explode('.', $key)[0], 'source_table' => $table, 'status' => $count ? 'open' : 'resolved',
                'details' => json_encode(['count' => $count, 'automatic_data_changes' => false], JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()];
        }
        DB::table('data_quality_issues')->upsert($rows, ['issue_key'], ['status', 'details', 'updated_at']);
        return collect($checks)->map(fn ($value) => $value[1])->all();
    }
}
