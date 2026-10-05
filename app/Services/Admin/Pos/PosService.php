<?php

declare(strict_types=1);

namespace App\Services\Admin\Pos;

use App\Models\ConfiguracionSitio;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class PosService
{
    public function getActiveRegister(int $userId): ?object
    {
        return DB::table('cajas_sesiones')
            ->where('cajero_id', $userId)
            ->where('estado', 'abierta')
            ->first();
    }

    public function getWarehouseIdForRegister(?object $cajaAbierta): int
    {
        $almacenId = 1;
        if ($cajaAbierta) {
            try {
                $cajaFisica = DB::table('cajas')->where('id', $cajaAbierta->caja_id)->first();
                if ($cajaFisica && isset($cajaFisica->sucursal_id)) {
                    $sucursal = DB::table('sucursales')->where('id', $cajaFisica->sucursal_id)->first();
                    if ($sucursal && isset($sucursal->almacen_id)) {
                        $almacenId = $sucursal->almacen_id;
                    }
                }
            } catch (\Exception $e) {
                // Keep default
            }
        }

        return $almacenId;
    }

    public function getProducts(int $almacenId, ?string $search = null, ?string $categoria = null): Collection
    {
        $query = DB::table('producto')
            ->join('variante', 'variante.producto_id', '=', 'producto.id')
            ->join('stock_almacen', function ($join) use ($almacenId) {
                $join->on('stock_almacen.variante_id', '=', 'variante.id')
                    ->where('stock_almacen.almacen_id', '=', $almacenId);
            })
            ->leftJoin('producto_imagen', function ($join) {
                $join->on('producto_imagen.producto_id', '=', 'producto.id')
                    ->where('producto_imagen.orden', '=', 0);
            })
            ->leftJoin('marca', 'marca.id', '=', 'producto.marca_id')
            ->leftJoin('producto_categoria', 'producto_categoria.producto_id', '=', 'producto.id')
            ->leftJoin('categoria', 'categoria.id', '=', 'producto_categoria.categoria_id')
            ->whereNull('producto.deleted_at')
            ->whereNull('variante.deleted_at')
            ->where('stock_almacen.cantidad', '>', 0)
            ->where('producto.activo', true);
        $query->where('variante.activo', true);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('producto.nombre', 'like', "%{$search}%")
                    ->orWhere('variante.sku', 'like', "%{$search}%");
            });
        }

        if ($categoria && $categoria !== 'Todas') {
            $query->where('categoria.nombre', $categoria);
        }

        return $query->select(
            'producto.id as producto_id',
            'producto.nombre',
            'variante.id as variante_id',
            'variante.sku',
            'variante.precio',
            'stock_almacen.cantidad as stock',
            'variante.atributos',
            'producto_imagen.url as imagen',
            'marca.nombre as marca_nombre',
            'categoria.nombre as categoria_nombre'
        )->orderBy('producto.nombre')->limit(150)->get()->unique('variante_id')->take(50)->values();
    }

    public function processSale(array $data, int $userId): array
    {
        $tipoComprobante = $data['tipo_comprobante'] ?? 'ticket';

        return DB::transaction(function () use ($data, $tipoComprobante, $userId) {
            $caja = DB::table('cajas_sesiones')->where('cajero_id', $userId)
                ->where('estado', 'abierta')->lockForUpdate()->first();
            if (! $caja) {
                throw new \InvalidArgumentException('Debes aperturar caja antes de realizar ventas.');
            }
            $almacenId = $this->getWarehouseIdForRegister($caja);
            $subtotalBruto = 0;
            $itemsValidados = [];
            $variantIds = array_column($data['items'], 'variante_id');
            if (count($variantIds) !== count(array_unique($variantIds))) {
                throw new \InvalidArgumentException('Agrupa las cantidades de cada variante en una sola línea.');
            }
            $items = $data['items'];
            usort($items, fn ($a, $b) => $a['variante_id'] <=> $b['variante_id']);

            foreach ($items as $item) {
                if ((int) $item['cantidad'] < 1) {
                    throw new \InvalidArgumentException('La cantidad debe ser positiva.');
                }
                $variante = DB::table('variante')->where('id', $item['variante_id'])->where('activo', true)->whereNull('deleted_at')->lockForUpdate()->first();
                if (! $variante) {
                    throw new \Exception('Variante no encontrada.');
                }
                $producto = DB::table('producto')->where('id', $variante->producto_id)
                    ->whereNull('deleted_at')->where('activo', true)->first();
                if (! $producto) {
                    throw new \InvalidArgumentException('El producto no está disponible para venta.');
                }

                $stockAlmacen = DB::table('stock_almacen')
                    ->where('almacen_id', $almacenId)
                    ->where('variante_id', $item['variante_id'])
                    ->lockForUpdate()
                    ->first();

                $cantidadLocal = $stockAlmacen ? (int) $stockAlmacen->cantidad : 0;
                if ($almacenId === (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1) &&
                    Schema::hasTable('reservas_stock')) {
                    $cantidadLocal -= (int) DB::table('reservas_stock')->where('variante_id', $item['variante_id'])
                        ->where('expires_at', '>', now())->sum('cantidad');
                }

                if ($cantidadLocal < $item['cantidad']) {
                    throw new \Exception('Stock local insuficiente para el producto: '.$item['producto_nombre']);
                }

                $precioReal = $variante->precio;
                $subtotalBruto += $precioReal * $item['cantidad'];

                $itemsValidados[] = [
                    'variante_id' => $item['variante_id'],
                    'producto_nombre' => $producto->nombre,
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $precioReal,
                ];
            }

            $descuento = floatval($data['descuento'] ?? 0);
            if ($descuento < 0 || $descuento > $subtotalBruto) {
                throw new \InvalidArgumentException('El descuento debe estar entre cero y el importe de la venta.');
            }
            $total = round($subtotalBruto - $descuento, 2);
            $this->validateSunatRules($tipoComprobante, $total, $data['cliente'] ?? []);
            $cliente_id = $this->resolveClient($tipoComprobante, $data['cliente'] ?? null);
            $pagos = ! empty($data['pagos']) ? $data['pagos'] : [['metodo_pago_id' => $data['metodo_pago_id'], 'monto' => $total]];
            foreach ($pagos as $pago) {
                if (! isset($pago['monto'], $pago['metodo_pago_id']) || $pago['monto'] < 0 ||
                    ! DB::table('metodos_pago')->where('id', $pago['metodo_pago_id'])->where('activo', true)->exists()) {
                    throw new \InvalidArgumentException('Los pagos requieren un importe válido y un método activo.');
                }
            }

            if (isset($data['pagos']) && is_array($data['pagos']) && count($data['pagos']) > 0) {
                $sumaPagos = array_sum(array_column($data['pagos'], 'monto'));
                if (round((float) $sumaPagos, 2) !== round($total, 2)) {
                    throw new \Exception('La suma de los pagos múltiples no coincide con el total de la venta.');
                }
            }

            $igvPorcentaje = (float) (ConfiguracionSitio::obtener('igv_porcentaje', '18'));
            $factor = 1 + ($igvPorcentaje / 100);
            $subtotal = round($total / $factor, 2);
            $igv = round($total - $subtotal, 2);

            $serie = DB::table('comprobantes_series')
                ->where('tipo_comprobante', $tipoComprobante)
                ->where('activo', true)
                ->lockForUpdate()
                ->first();

            if (! $serie) {
                throw new \Exception('No hay una serie activa configurada para este comprobante.');
            }

            $nuevoCorrelativo = $serie->correlativo_actual + 1;
            $codigoTicket = $serie->serie.'-'.str_pad((string) $nuevoCorrelativo, 6, '0', STR_PAD_LEFT);

            DB::table('comprobantes_series')->where('id', $serie->id)->increment('correlativo_actual');

            $ventaId = DB::table('ventas_pos')->insertGetId([
                'codigo_ticket' => $codigoTicket,
                'cajero_id' => $userId,
                'caja_sesion_id' => $caja->id,
                'cliente_id' => $cliente_id,
                'metodo_pago_id' => $data['metodo_pago_id'],
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'igv' => $igv,
                'total' => $total,
                'tipo_comprobante' => $tipoComprobante,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if (isset($data['pagos']) && is_array($data['pagos']) && count($data['pagos']) > 0) {
                foreach ($data['pagos'] as $pago) {
                    if ($pago['monto'] > 0) {
                        DB::table('venta_pos_pagos')->insert([
                            'venta_pos_id' => $ventaId,
                            'metodo_pago_id' => $pago['metodo_pago_id'],
                            'monto' => $pago['monto'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            } else {
                DB::table('venta_pos_pagos')->insert([
                    'venta_pos_id' => $ventaId,
                    'metodo_pago_id' => $data['metodo_pago_id'],
                    'monto' => $total,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach ($itemsValidados as $item) {
                DB::table('venta_pos_items')->insert([
                    'venta_pos_id' => $ventaId,
                    'variante_id' => $item['variante_id'],
                    'producto_nombre' => $item['producto_nombre'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $item['precio_unitario'] * $item['cantidad'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $stockAlmacen = DB::table('stock_almacen')
                    ->where('almacen_id', $almacenId)
                    ->where('variante_id', $item['variante_id'])
                    ->first();

                if ($stockAlmacen) {
                    DB::table('stock_almacen')->where('id', $stockAlmacen->id)->decrement('cantidad', $item['cantidad']);
                } else {
                    DB::table('stock_almacen')->insert([
                        'almacen_id' => $almacenId,
                        'variante_id' => $item['variante_id'],
                        'cantidad' => 0 - $item['cantidad'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::statement('UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?', [$item['variante_id'], $item['variante_id']]);

                DB::table('movimientos_almacen')->insert([
                    'almacen_id' => $almacenId,
                    'variante_id' => $item['variante_id'],
                    'tipo' => 'salida',
                    'cantidad' => -$item['cantidad'],
                    'referencia' => 'Venta POS - '.$codigoTicket,
                    'usuario_id' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return ['venta_id' => $ventaId, 'codigo_ticket' => $codigoTicket, 'total' => $total];
        });
    }

    private function validateSunatRules(string $tipoComprobante, float $total, array $cliente): void
    {
        if ($tipoComprobante === 'factura') {
            if (($cliente['tipo_documento'] ?? '') !== 'RUC' || ! preg_match('/^\d{11}$/', $cliente['numero_documento'] ?? '')) {
                throw new \Exception('La Factura exige un RUC válido de 11 dígitos.');
            }
            if (empty($cliente['nombre_razon_social'])) {
                throw new \Exception('La Factura exige una Razón Social.');
            }
        } elseif ($tipoComprobante === 'boleta' && $total >= 700) {
            if (empty($cliente['numero_documento'])) {
                throw new \Exception('Toda Boleta mayor o igual a S/ 700 exige identificar al cliente (DNI/CE).');
            }
        }
    }

    private function resolveClient(string $tipoComprobante, ?array $clienteData): ?int
    {
        if ($tipoComprobante === 'ticket' || ! $clienteData || empty($clienteData['numero_documento'])) {
            return null;
        }

        $clienteRow = DB::table('clientes')->where('numero_documento', $clienteData['numero_documento'])->first();
        if ($clienteRow) {
            DB::table('clientes')->where('id', $clienteRow->id)->update([
                'nombre_razon_social' => $clienteData['nombre_razon_social'] ?? $clienteRow->nombre_razon_social,
                'direccion' => $clienteData['direccion'] ?? $clienteRow->direccion,
                'updated_at' => now(),
            ]);

            return $clienteRow->id;
        }

        return DB::table('clientes')->insertGetId([
            'tipo_documento' => $clienteData['tipo_documento'] ?? 'DNI',
            'numero_documento' => $clienteData['numero_documento'],
            'nombre_razon_social' => $clienteData['nombre_razon_social'] ?? 'Sin Nombre',
            'direccion' => $clienteData['direccion'] ?? '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function findClientFromApi(string $tipoDocumento, string $numeroDocumento): array
    {
        $cliente = DB::table('clientes')->where('numero_documento', $numeroDocumento)->first();
        if ($cliente) {
            return [
                'success' => true,
                'origen' => 'local',
                'data' => [
                    'nombre_razon_social' => $cliente->nombre_razon_social,
                    'direccion' => $cliente->direccion,
                    'tipo_documento' => $cliente->tipo_documento,
                ],
            ];
        }

        try {
            if ($tipoDocumento === 'DNI') {
                $response = Http::timeout(5)->get("https://api.apis.net.pe/v1/dni?numero={$numeroDocumento}");
                if ($response->successful()) {
                    return [
                        'success' => true,
                        'origen' => 'api',
                        'data' => [
                            'nombre_razon_social' => $response->json()['nombre'] ?? '',
                            'direccion' => '',
                            'tipo_documento' => 'DNI',
                        ],
                    ];
                }
            } elseif ($tipoDocumento === 'RUC') {
                $response = Http::timeout(5)->get("https://api.apis.net.pe/v1/ruc?numero={$numeroDocumento}");
                if ($response->successful()) {
                    return [
                        'success' => true,
                        'origen' => 'api',
                        'data' => [
                            'nombre_razon_social' => $response->json()['nombre'] ?? '',
                            'direccion' => $response->json()['direccion'] ?? '',
                            'tipo_documento' => 'RUC',
                        ],
                    ];
                }
            }
        } catch (\Exception $e) {
            Log::error('Error consultando API externa: '.$e->getMessage());
        }

        return ['success' => false, 'error' => 'No encontrado en API, ingrese los datos manualmente.'];
    }
}
