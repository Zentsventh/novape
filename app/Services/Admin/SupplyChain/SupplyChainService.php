<?php

declare(strict_types=1);

namespace App\Services\Admin\SupplyChain;

use App\Models\ConfiguracionSitio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SupplyChainService
{
    public function getIndexData(array $filters): array
    {
        $query = DB::table('compras')
            ->leftJoin('proveedor', 'compras.proveedor_id', '=', 'proveedor.id')
            ->select('compras.id', 'compras.numero_orden', 'compras.total', 'compras.estado', 'compras.fecha_compra', 'proveedor.nombre as proveedor_nombre');

        if (! empty($filters['proveedor_id'])) {
            $query->where('compras.proveedor_id', $filters['proveedor_id']);
        }
        if (! empty($filters['estado'])) {
            $query->where('compras.estado', $filters['estado']);
        }
        if (! empty($filters['marca_id'])) {
            $query->whereExists(function ($q) use ($filters) {
                $q->select(DB::raw(1))->from('compra_items')
                    ->join('producto', 'producto.id', '=', 'compra_items.producto_id')
                    ->whereColumn('compra_items.compra_id', 'compras.id')
                    ->where('producto.marca_id', $filters['marca_id']);
            });
        }
        if (! empty($filters['categoria_id'])) {
            $query->whereExists(function ($q) use ($filters) {
                $q->select(DB::raw(1))->from('compra_items')
                    ->join('producto', 'producto.id', '=', 'compra_items.producto_id')
                    ->join('producto_categoria', 'producto_categoria.producto_id', '=', 'producto.id')
                    ->leftJoin('categoria', 'categoria.id', '=', 'producto_categoria.categoria_id')
                    ->whereColumn('compra_items.compra_id', 'compras.id')
                    ->where(function ($q2) use ($filters) {
                        $q2->where('categoria.id', $filters['categoria_id'])
                            ->orWhere('categoria.categoria_padre_id', $filters['categoria_id']);
                    });
            });
        }
        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('compras.numero_orden', 'like', "%{$search}%")
                    ->orWhereExists(function ($q2) use ($search) {
                        $q2->select(DB::raw(1))->from('compra_items')
                            ->join('producto', 'producto.id', '=', 'compra_items.producto_id')
                            ->join('variante', 'variante.id', '=', 'compra_items.variante_id')
                            ->whereColumn('compra_items.compra_id', 'compras.id')
                            ->where(function ($q3) use ($search) {
                                $q3->where('producto.nombre', 'like', "%{$search}%")
                                    ->orWhere('variante.sku', 'like', "%{$search}%");
                            });
                    });
            });
        }
        if (! empty($filters['producto_id'])) {
            $query->whereExists(fn ($items) => $items->selectRaw('1')->from('compra_items')
                ->whereColumn('compra_items.compra_id', 'compras.id')->where('compra_items.producto_id', $filters['producto_id']));
        }

        $totalGastado = (float) (clone $query)->where('compras.estado', 'completado')->sum('compras.total');
        $comprasPendientes = (clone $query)->where('compras.estado', 'pendiente')->count();
        $compras = $query->orderBy('compras.fecha_compra', 'desc')->orderByDesc('compras.id')->paginate(30)->withQueryString();

        $historialProducto = null;
        if (! empty($filters['producto_id'])) {
            $historialProducto = DB::table('compra_items')
                ->join('compras', 'compra_items.compra_id', '=', 'compras.id')
                ->leftJoin('proveedor', 'compras.proveedor_id', '=', 'proveedor.id')
                ->where('compra_items.producto_id', $filters['producto_id'])
                ->select(
                    'proveedor.nombre as proveedor_nombre',
                    'compras.numero_orden',
                    'compras.fecha_compra',
                    'compras.estado',
                    'compra_items.cantidad',
                    'compra_items.costo_unitario',
                    'compra_items.subtotal'
                )
                ->orderBy('compras.fecha_compra', 'desc')
                ->orderByDesc('compra_items.id')->paginate(30, ['*'], 'historial_page')->withQueryString();
        }

        return [
            'compras' => $compras,
            'totalGastado' => $totalGastado,
            'comprasPendientes' => $comprasPendientes,
            'proveedores' => DB::table('proveedor')->orderBy('nombre')->get(['id', 'nombre']),
            'categorias' => DB::table('categoria')->where('activa', true)->whereNull('categoria_padre_id')->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => DB::table('marca')->orderBy('nombre')->get(['id', 'nombre']),
            'historialProducto' => $historialProducto,
            'productoFiltro' => empty($filters['producto_id']) ? null : DB::table('variante')->where('producto_id', $filters['producto_id'])->whereNull('deleted_at')->orderBy('id')->first(['id as variante_id']),
        ];
    }

    public function createPurchaseOrder(array $data): string
    {
        return DB::transaction(function () use ($data) {
            $total = 0;
            foreach ($data['items'] as $item) {
                if (! DB::table('variante')->where('id', $item['variante_id'])->where('producto_id', $item['producto_id'])
                    ->whereNull('deleted_at')->exists()) {
                    throw new \InvalidArgumentException('La variante no pertenece al producto indicado o fue eliminada.');
                }
                $total += $item['costo_unitario'] * $item['cantidad'];
            }

            $numeroOrden = 'OC-'.date('Y').'-'.strtoupper((string) Str::ulid());

            $compraId = DB::table('compras')->insertGetId([
                'numero_orden' => $numeroOrden,
                'proveedor_id' => $data['proveedor_id'],
                'proveedor_snapshot' => json_encode((array) DB::table('proveedor')->where('id', $data['proveedor_id'])->first(['id', 'nombre', 'ruc', 'direccion']), JSON_THROW_ON_ERROR),
                'total' => $total,
                'estado' => 'pendiente',
                'notas' => $data['notas'] ?? null,
                'fecha_compra' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                DB::table('compra_items')->insert([
                    'compra_id' => $compraId,
                    'producto_id' => $item['producto_id'],
                    'variante_id' => $item['variante_id'],
                    'cantidad' => $item['cantidad'],
                    'costo_unitario' => $item['costo_unitario'],
                    'subtotal' => $item['costo_unitario'] * $item['cantidad'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return "Orden {$numeroOrden} creada por S/ ".number_format($total, 2);
        });
    }

    public function completePurchaseOrder(int $id, int $userId): void
    {
        $compra = DB::table('compras')->where('id', $id)->first();
        if (! $compra || $compra->estado === 'completado') {
            throw new \Exception('La compra no existe o ya está completada.');
        }

        DB::transaction(function () use ($id, $compra, $userId) {
            $compra = DB::table('compras')->where('id', $id)->lockForUpdate()->first();
            if (! $compra || $compra->estado !== 'pendiente') {
                throw new \InvalidArgumentException('Solo se pueden recibir compras pendientes.');
            }
            DB::table('compras')->where('id', $id)->update([
                'estado' => 'completado',
                'updated_at' => now(),
            ]);

            $items = DB::table('compra_items')->where('compra_id', $id)->orderBy('variante_id')->get();
            $almacenId = ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);

            DB::table('variante')->whereIn('id', $items->pluck('variante_id')->filter()->unique())->orderBy('id')->lockForUpdate()->get(['id']);

            foreach ($items as $item) {
                $variante = DB::table('variante')->where('id', $item->variante_id)->lockForUpdate()->first();
                if (! $variante || $variante->deleted_at || $variante->producto_id != $item->producto_id) {
                    throw new \InvalidArgumentException('La compra contiene una variante inválida.');
                }

                $stockActual = $variante->stock;
                $costoActual = $variante->precio_compra ?? 0;

                $nuevoStock = $stockActual + $item->cantidad;
                $nuevoPPP = $costoActual;

                if ($nuevoStock > 0) {
                    $nuevoPPP = (($stockActual * $costoActual) + ($item->cantidad * $item->costo_unitario)) / $nuevoStock;
                }

                DB::table('variante')->where('id', $item->variante_id)->update([
                    'precio_compra' => round($nuevoPPP, 4),
                    'updated_at' => now(),
                ]);

                app(\App\Services\Inventario\InventoryService::class)->registrarMovimiento(
                    varianteId: $item->variante_id,
                    almacenId: (int) $almacenId,
                    cantidad: (int) $item->cantidad,
                    tipo: 'entrada',
                    motivo: 'Compra Proveedor - Orden '.$compra->numero_orden,
                    usuarioId: $userId,
                    referencia: null,
                    costoUnitario: $item->costo_unitario === null ? null : (float) $item->costo_unitario,
                    operationKey: 'purchase:'.$id.':'.$item->id
                );
            }
        });
    }

    public function deletePurchaseOrder(int $id): void
    {
        $compra = DB::table('compras')->where('id', $id)->first();
        if ($compra && $compra->estado === 'completado') {
            throw new \Exception('No se puede eliminar una compra completada por motivos de auditoría de inventario.');
        }

        DB::transaction(function () use ($id) {
            $compra = DB::table('compras')->where('id', $id)->lockForUpdate()->first();
            if (! $compra || $compra->estado !== 'pendiente') {
                throw new \InvalidArgumentException('Solo se pueden eliminar compras pendientes.');
            }
            DB::table('compra_items')->where('compra_id', $id)->delete();
            DB::table('compras')->where('id', $id)->delete();
        });
    }
}
