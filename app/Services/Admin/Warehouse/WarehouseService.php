<?php

declare(strict_types=1);

namespace App\Services\Admin\Warehouse;

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

        $productos = DB::table('producto')
            ->join('variante', 'variante.producto_id', '=', 'producto.id')
            ->leftJoin('producto_categoria', 'producto_categoria.producto_id', '=', 'producto.id')
            ->leftJoin('categoria', 'categoria.id', '=', 'producto_categoria.categoria_id')
            ->leftJoin('categoria as padre', 'categoria.categoria_padre_id', '=', 'padre.id')
            ->whereNull('producto.deleted_at')
            ->whereNull('variante.deleted_at')
            ->where('producto.activo', true)
            ->select(
                'producto.nombre',
                'producto.marca_id',
                'variante.id as variante_id',
                'variante.sku',
                DB::raw('COALESCE(padre.id, categoria.id) as category_id')
            )
            ->distinct()
            ->orderBy('producto.nombre')
            ->get();

        $categorias = DB::table('categoria')->where('activa', true)->whereNull('categoria_padre_id')->orderBy('nombre')->get();
        $marcas = DB::table('marca')->orderBy('nombre')->get();
        $stocks = DB::table('stock_almacen')->select('almacen_id', 'variante_id', 'cantidad')->get();

        return compact('almacenes', 'productos', 'categorias', 'marcas', 'stocks');
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
        if (DB::table('movimientos_almacen')->where('almacen_id', $id)->orWhere('almacen_destino_id', $id)->exists()) {
            throw new \InvalidArgumentException('No se puede eliminar un almacén con movimientos históricos.');
        }
        $stock = DB::table('stock_almacen')->where('almacen_id', $id)->sum('cantidad');
        if ($stock > 0) {
            throw new \Exception('No puedes eliminar un almacén con stock. Transfiere los productos primero.');
        }

        DB::transaction(function () use ($id) {
            DB::table('stock_almacen')->where('almacen_id', $id)->delete();
            DB::table('movimientos_almacen')->where('almacen_id', $id)->delete();
            DB::table('almacenes')->where('id', $id)->delete();
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
            $stockOrigen = DB::table('stock_almacen')
                ->where('almacen_id', $data['almacen_origen_id'])
                ->where('variante_id', $data['variante_id'])
                ->lockForUpdate()
                ->first();

            if (! $stockOrigen || $stockOrigen->cantidad < $data['cantidad']) {
                throw new \Exception('Stock insuficiente en el almacén de origen.');
            }

            DB::table('stock_almacen')->where('id', $stockOrigen->id)->decrement('cantidad', $data['cantidad']);

            $stockDestino = DB::table('stock_almacen')
                ->where('almacen_id', $data['almacen_destino_id'])
                ->where('variante_id', $data['variante_id'])
                ->lockForUpdate()
                ->first();

            if ($stockDestino) {
                DB::table('stock_almacen')->where('id', $stockDestino->id)->increment('cantidad', $data['cantidad']);
            } else {
                DB::table('stock_almacen')->insert([
                    'almacen_id' => $data['almacen_destino_id'],
                    'variante_id' => $data['variante_id'],
                    'cantidad' => $data['cantidad'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('movimientos_almacen')->insert([
                'almacen_id' => $data['almacen_origen_id'],
                'variante_id' => $data['variante_id'],
                'tipo' => 'transferencia',
                'cantidad' => -$data['cantidad'],
                'referencia' => $data['referencia'] ?? 'Transferencia manual',
                'almacen_destino_id' => $data['almacen_destino_id'],
                'usuario_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('movimientos_almacen')->insert([
                'almacen_id' => $data['almacen_destino_id'],
                'variante_id' => $data['variante_id'],
                'tipo' => 'entrada',
                'cantidad' => $data['cantidad'],
                'referencia' => 'Transferencia desde almacén ID: '.$data['almacen_origen_id'].' - '.($data['referencia'] ?? ''),
                'usuario_id' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }
}
