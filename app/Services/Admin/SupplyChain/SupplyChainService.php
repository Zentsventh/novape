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
            $query->join('compra_items', 'compras.id', '=', 'compra_items.compra_id')
                ->where('compra_items.producto_id', $filters['producto_id'])
                ->distinct();
        }

        $compras = $query->orderBy('compras.fecha_compra', 'desc')->get();

        $productos = DB::table('producto')
            ->join('variante', 'variante.producto_id', '=', 'producto.id')
            ->leftJoin('producto_categoria', 'producto_categoria.producto_id', '=', 'producto.id')
            ->leftJoin('categoria', 'categoria.id', '=', 'producto_categoria.categoria_id')
            ->leftJoin('categoria as padre', 'categoria.categoria_padre_id', '=', 'padre.id')
            ->whereNull('producto.deleted_at')
            ->whereNull('variante.deleted_at')
            ->select(
                'producto.id as producto_id',
                'producto.nombre',
                'producto.marca_id',
                'variante.id as variante_id',
                'variante.sku',
                'variante.precio',
                DB::raw('COALESCE(padre.id, categoria.id) as parent_category_id'),
                DB::raw('COALESCE(padre.nombre, categoria.nombre) as parent_category_nombre')
            )
            ->orderBy('parent_category_nombre')
            ->orderBy('producto.nombre')
            ->get();

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
                ->get();
        }

        return [
            'compras' => $compras,
            'totalGastado' => $compras->where('estado', 'completado')->sum('total'),
            'comprasPendientes' => $compras->where('estado', 'pendiente')->count(),
            'proveedores' => DB::table('proveedor')->orderBy('nombre')->get(['id', 'nombre']),
            'productos' => $productos,
            'categorias' => DB::table('categoria')->where('activa', true)->whereNull('categoria_padre_id')->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => DB::table('marca')->orderBy('nombre')->get(['id', 'nombre']),
            'historialProducto' => $historialProducto,
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

            foreach ($items as $item) {
                $variante = DB::table('variante')->where('id', $item->variante_id)->lockForUpdate()->first();
                if (! $variante || $variante->deleted_at || $variante->producto_id != $item->producto_id) {
                    throw new \InvalidArgumentException('La compra contiene una variante inválida.');
                }

                if ($variante) {
                    $stockActual = $variante->stock;
                    $costoActual = $variante->precio_compra ?? 0;

                    $nuevoStock = $stockActual + $item->cantidad;
                    $nuevoPPP = $costoActual;

                    if ($nuevoStock > 0) {
                        $nuevoPPP = (($stockActual * $costoActual) + ($item->cantidad * $item->costo_unitario)) / $nuevoStock;
                    }

                    DB::table('variante')->where('id', $item->variante_id)->update([
                        'precio_compra' => $nuevoPPP,
                        'updated_at' => now(),
                    ]);
                }

                $stockAlmacen = DB::table('stock_almacen')
                    ->where('almacen_id', $almacenId)
                    ->where('variante_id', $item->variante_id)
                    ->lockForUpdate()
                    ->first();

                if ($stockAlmacen) {
                    DB::table('stock_almacen')->where('id', $stockAlmacen->id)->increment('cantidad', $item->cantidad);
                } else {
                    DB::table('stock_almacen')->insert([
                        'almacen_id' => $almacenId,
                        'variante_id' => $item->variante_id,
                        'cantidad' => $item->cantidad,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::statement('UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?', [$item->variante_id, $item->variante_id]);

                DB::table('movimientos_almacen')->insert([
                    'almacen_id' => $almacenId,
                    'variante_id' => $item->variante_id,
                    'tipo' => 'entrada',
                    'cantidad' => $item->cantidad,
                    'referencia' => 'Compra Proveedor - Orden '.$compra->numero_orden,
                    'usuario_id' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
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
