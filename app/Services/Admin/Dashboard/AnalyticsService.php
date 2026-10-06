<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Models\Categoria;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function getDashboardStats(string $startDate, string $endDate, string $sortBy, string $sortOrder, ?string $status = null, ?string $q = null): array
    {
        $dateFilterQuery = function ($query) use ($startDate, $endDate, $status, $q) {
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }
            if ($status) {
                $query->whereRaw('LOWER(estado) = ?', [strtolower($status)]);
            }
            if ($q) {
                $query->where(function ($sq) use ($q) {
                    $sq->where('codigo', 'like', "%{$q}%")
                        ->orWhereHas('usuario', function ($uq) use ($q) {
                            $uq->where('nombres', 'like', "%{$q}%")
                                ->orWhere('apellidos', 'like', "%{$q}%");
                        });
                });
            }

            return $query;
        };

        $totalProductos = Producto::count();
        $totalCategorias = Categoria::count();

        $totalPedidos = $dateFilterQuery(Pedido::query())->count();
        $pedidosPendientes = $dateFilterQuery(Pedido::whereRaw('LOWER(estado) = ?', ['pendiente']))->count();
        $pedidosEnviados = $dateFilterQuery(Pedido::whereRaw('LOWER(estado) = ?', ['enviado']))->count();
        $pedidosCompletados = $dateFilterQuery(Pedido::whereRaw('LOWER(estado) = ?', ['completado']))->count();
        $pedidosCancelados = $dateFilterQuery(Pedido::whereRaw('LOWER(estado) = ?', ['cancelado']))->count();

        $ventasTotalQuery = Pedido::whereRaw('LOWER(estado) IN (?, ?, ?, ?)', ['pagado', 'procesando', 'enviado', 'completado']);
        $ventasTotal = (float) $ventasTotalQuery->when($startDate, fn ($q) => $q->where('created_at', '>=', Carbon::parse($startDate)->startOfDay()))->when($endDate, fn ($q) => $q->where('created_at', '<', Carbon::parse($endDate)->addDay()->startOfDay()))->sum('total');

        $dateOnlyQuery = function ($query) use ($startDate, $endDate) {
            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }
            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            return $query;
        };
        $ventasWebTotal = $ventasTotal;
        $ventasPosQuery = DB::table('ventas_pos');
        $ventasPosTotal = (float) $dateOnlyQuery($ventasPosQuery)->sum('total');
        $ventasTotal += $ventasPosTotal;

        $costosGastos = (float) $dateOnlyQuery(DB::table('gastos'))->sum('monto');
        $costosCompras = (float) $dateOnlyQuery(DB::table('compras')->where('estado', 'completado'))->sum('total');

        $costosTotal = $costosGastos + $costosCompras;
        $gananciaNeta = $ventasTotal - $costosTotal;

        $ventasMesQuery = Pedido::whereRaw('LOWER(estado) IN (?, ?, ?, ?)', ['pagado', 'procesando', 'enviado', 'completado'])
            ->where('created_at', '>=', now()->startOfMonth());
        $ventasMes = (float) $ventasMesQuery->sum('total');

        $ventasPosMesQuery = DB::table('ventas_pos')->where('created_at', '>=', now()->startOfMonth());
        $ventasMes += (float) $ventasPosMesQuery->sum('total');

        $pedidosRecientes = $dateFilterQuery(Pedido::with('usuario'))
            ->orderBy($sortBy, $sortOrder)
            ->limit(10)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'codigo' => $p->codigo,
                    'total' => $p->total,
                    'estado' => $p->estado,
                    'created_at' => $p->created_at,
                    'usuario_nombre' => $p->usuario ? $p->usuario->nombres.' '.$p->usuario->apellidos : 'Cliente',
                ];
            });

        $endDateCarbon = $endDate ? Carbon::parse($endDate) : now();
        $ventasSemana = [];
        $nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        for ($i = 6; $i >= 0; $i--) {
            $day = $endDateCarbon->copy()->subDays($i);
            $webSales = (float) Pedido::whereRaw('LOWER(estado) IN (?, ?, ?, ?)', ['pagado', 'procesando', 'enviado', 'completado'])
                ->whereDate('created_at', $day)
                ->sum('total');
            $posSales = (float) DB::table('ventas_pos')->whereDate('created_at', $day)->sum('total');
            $ventasSemana[] = [
                'dia' => $nombresDias[$day->dayOfWeek],
                'total' => $webSales + $posSales,
            ];
        }

        return [
            'totalProductos' => $totalProductos,
            'totalCategorias' => $totalCategorias,
            'totalPedidos' => $totalPedidos,
            'pedidosPendientes' => $pedidosPendientes,
            'pedidosEnviados' => $pedidosEnviados,
            'pedidosCompletados' => $pedidosCompletados,
            'pedidosCancelados' => $pedidosCancelados,
            'ventasTotal' => $ventasTotal,
            'ventasWeb' => $ventasWebTotal,
            'ventasPos' => $ventasPosTotal,
            'costosTotal' => $costosTotal,
            'gananciaNeta' => $gananciaNeta,
            'ventasMes' => $ventasMes,
            'pedidosRecientes' => $pedidosRecientes,
            'ventasSemana' => $ventasSemana,
            'stockBajo' => $this->getLowStock(),
            'topProductosVendidos' => $this->getTopProducts($startDate, $endDate),
        ];
    }

    public function getLowStock(int $limit = 150): array
    {
        $allLowStock = DB::select('
            SELECT p.id, p.nombre, COALESCE(SUM(v.stock), 0) as stock_total
            FROM producto p
            LEFT JOIN variante v ON v.producto_id = p.id
                AND v.deleted_at IS NULL
            WHERE p.deleted_at IS NULL AND p.activo = 1
            GROUP BY p.id, p.nombre
            HAVING COALESCE(SUM(v.stock), 0) <= COALESCE(SUM(v.stock_minimo), 5)
            ORDER BY stock_total ASC
            LIMIT ?
        ', [$limit]);

        $productIds = array_column($allLowStock, 'id');
        $productosData = Producto::with(['imagenes', 'marca'])->whereIn('id', $productIds)->get()->keyBy('id');

        return collect($allLowStock)->map(function ($r) use ($productosData) {
            $p = $productosData->get($r->id);

            return [
                'id' => $r->id,
                'nombre' => $r->nombre,
                'marca' => $p && $p->marca ? $p->marca->nombre : null,
                'imagen' => $p && $p->imagenes->first() ? $p->imagenes->first()->url : null,
                'stock' => (int) $r->stock_total,
                'activo' => $p ? $p->activo : false,
            ];
        })->toArray();
    }

    public function getTopProducts(?string $startDate, ?string $endDate): array
    {
        $queryTop = DB::query()
            ->fromSub(function ($query) use ($startDate, $endDate) {
                $q1 = DB::table('venta_pos_items')
                    ->join('ventas_pos', 'ventas_pos.id', '=', 'venta_pos_items.venta_pos_id') // Corrected join key
                    ->select('variante_id', 'cantidad', DB::raw('venta_pos_items.cantidad * venta_pos_items.precio_unitario as ingresos'));
                if ($startDate) {
                    $q1->whereDate('ventas_pos.created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $q1->whereDate('ventas_pos.created_at', '<=', $endDate);
                }

                $q2 = DB::table('pedido_item')
                    ->join('pedido', 'pedido.id', '=', 'pedido_item.pedido_id')
                    ->where('pedido.estado', 'completado')
                    ->select('variante_id', 'cantidad', DB::raw('pedido_item.cantidad * pedido_item.precio_unitario as ingresos'));
                if ($startDate) {
                    $q2->whereDate('pedido.created_at', '>=', $startDate);
                }
                if ($endDate) {
                    $q2->whereDate('pedido.created_at', '<=', $endDate);
                }

                $query->from($q1->unionAll($q2), 'ventas_combinadas');
            }, 'ventas_combinadas')
            ->join('variante', 'variante.id', '=', 'ventas_combinadas.variante_id')
            ->join('producto', 'producto.id', '=', 'variante.producto_id')
            ->select('producto.id', 'producto.nombre', DB::raw('SUM(cantidad) as total_vendido'), DB::raw('SUM(ingresos) as ingresos'))
            ->groupBy('producto.id', 'producto.nombre')
            ->orderBy('total_vendido', 'desc')
            ->orderBy('producto.id')
            ->limit(6)
            ->get();

        return $queryTop->map(fn ($item) => ['id' => (int) $item->id, 'nombre' => $item->nombre, 'cantidad' => (int) $item->total_vendido, 'ingresos' => (float) $item->ingresos])->all();
    }

    public function searchGlobal(string $query, object $user): array
    {
        $productos = [];
        $pedidos = [];
        $usuarios = [];

        if ($user->tienePermiso('ver_productos')) {
            $productos = Producto::with('variantes')
                ->where('nombre', 'like', "%$query%")
                ->orWhere('id', 'like', "$query%")
                ->limit(5)->get()->map(function ($p) {
                    $stock = 0;
                    foreach ($p->variantes as $v) {
                        $stock += $v->stock;
                    }

                    return [
                        'id' => $p->id,
                        'nombre' => $p->nombre,
                        'precio' => $p->variantes->first() ? $p->variantes->first()->precio : 0,
                        'stock' => $stock,
                    ];
                });
        }

        if ($user->tienePermiso('ver_pedidos')) {
            $pedidosQuery = Pedido::with('usuario:id,nombres,apellidos')
                ->where('id', 'like', "$query%")
                ->orWhereHas('usuario', function ($q) use ($query) {
                    $q->where('nombres', 'like', "%$query%")->orWhere('email', 'like', "%$query%");
                });
            $pedidos = $pedidosQuery->limit(5)->get(['id', 'estado', 'total', 'usuario_id']);
        }

        if ($user->tienePermiso('ver_usuarios')) {
            $usuarios = Usuario::where('nombres', 'like', "%$query%")
                ->orWhere('apellidos', 'like', "%$query%")
                ->orWhere('email', 'like', "%$query%")
                ->orWhere('dni', 'like', "%$query%")
                ->limit(5)->get(['id', 'nombres', 'apellidos', 'email', 'dni']);
        }

        return ['productos' => $productos, 'pedidos' => $pedidos, 'usuarios' => $usuarios];
    }
}
