<?php

declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

use App\Services\Inventory\StockAvailability;
use Illuminate\Support\Facades\DB;

class WarehouseService
{
    public function getIndexData(): array
    {
        $almacenes = DB::table('almacenes')->orderBy('id', 'asc')->get();

        $stockPorAlmacen = DB::table('stock_almacen')
            ->select('almacen_id', DB::raw('SUM(cantidad) as total_unidades'), DB::raw('COUNT(DISTINCT variante_id) as total_skus'))
            ->groupBy('almacen_id')
            ->get()
            ->keyBy('almacen_id');

        foreach ($almacenes as $almacen) {
            $almacen->total_unidades = $stockPorAlmacen[$almacen->id]->total_unidades ?? 0;
            $almacen->total_skus = $stockPorAlmacen[$almacen->id]->total_skus ?? 0;
        }

        $categorias = DB::table('categoria')->where('activa', true)->whereNull('categoria_padre_id')->orderBy('nombre')->get();
        $marcas = DB::table('marca')->orderBy('nombre')->get();

        return compact('almacenes', 'categorias', 'marcas');
    }

    public function createWarehouse(array $data): void
    {
        DB::table('almacenes')->insert([
            'nombre' => $data['nombre'],
            'direccion' => $data['direccion'] ?? null,
            'activo' => $data['activo'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function deleteWarehouse(int $id): void
    {
        // Used warehouses remain addressable by historical records; deletion means
        // deactivation and never deletes balances or journal entries.
        DB::transaction(function () use ($id) {
            $warehouse = DB::table('almacenes')->where('id', $id)->lockForUpdate()->first();
            if (! $warehouse) throw new \InvalidArgumentException('El almacén no existe.');
            if ((int) \App\Models\ConfiguracionSitio::obtener('almacen_ecommerce_id', 1) === $id) {
                throw new \InvalidArgumentException('Selecciona otro almacén de comercio electrónico antes de desactivar este.');
            }
            if (DB::table('stock_almacen')->where('almacen_id', $id)->where('cantidad', '>', 0)->exists()) {
                throw new \InvalidArgumentException('Transfiere el stock antes de desactivar el almacén.');
            }
            DB::table('almacenes')->where('id', $id)->update(['activo' => false, 'updated_at' => now()]);
        });
    }

    public function getKardex(int $id)
    {
        $almacen = DB::table('almacenes')->where('id', $id)->first();
        if (! $almacen) {
            return null;
        }

        $movimientos = DB::table('movimientos_almacen')
            ->join('variante', 'movimientos_almacen.variante_id', '=', 'variante.id')
            ->join('producto', 'variante.producto_id', '=', 'producto.id')
            ->leftJoin('almacenes as destino', 'movimientos_almacen.almacen_destino_id', '=', 'destino.id')
            ->select(
                'movimientos_almacen.*',
                'producto.nombre as producto_nombre',
                'variante.sku',
                'destino.nombre as destino_nombre'
            )
            ->where('movimientos_almacen.almacen_id', $id)
            ->orderBy('movimientos_almacen.created_at', 'desc')
            ->paginate(20);

        return compact('almacen', 'movimientos');
    }

    public function transferStock(array $data, int $userId): void
    {
        DB::transaction(function () use ($data, $userId) {
            if ($data['almacen_origen_id'] == $data['almacen_destino_id'] || (int) $data['cantidad'] < 1) {
                throw new \InvalidArgumentException('La transferencia requiere almacenes distintos y una cantidad positiva.');
            }
            $variante = DB::table('variante')->where('id', $data['variante_id'])->whereNull('deleted_at')->lockForUpdate()->first();
            if (! $variante) {
                throw new \InvalidArgumentException('La variante no está disponible.');
            }
            DB::table('almacenes')->whereIn('id', [$data['almacen_origen_id'], $data['almacen_destino_id']])->orderBy('id')->lockForUpdate()->get(['id']);
            app(\App\Services\Inventario\InventoryService::class)->registrarMovimiento(
                varianteId: (int) $data['variante_id'],
                almacenId: (int) $data['almacen_origen_id'],
                cantidad: -(int) $data['cantidad'],
                tipo: 'transferencia',
                motivo: $data['referencia'] ?? 'Transferencia manual',
                usuarioId: $userId,
                operationKey: isset($data['operation_key']) ? 'transfer:'.$data['operation_key'].':out' : null
            );

            app(\App\Services\Inventario\InventoryService::class)->registrarMovimiento(
                varianteId: (int) $data['variante_id'],
                almacenId: (int) $data['almacen_destino_id'],
                cantidad: (int) $data['cantidad'],
                tipo: 'entrada',
                motivo: 'Transferencia desde almacén ID: '.$data['almacen_origen_id'].' - '.($data['referencia'] ?? ''),
                usuarioId: $userId,
                operationKey: isset($data['operation_key']) ? 'transfer:'.$data['operation_key'].':in' : null
            );
        });
    }
}
