<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\Warehouse\InventoryAuditService;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class InventarioController extends Controller
{
    public function __construct(
        private readonly InventoryAuditService $inventoryService,
        private readonly \App\Services\Inventario\InventoryService $inventoryWriter
    ) {}

    public function dashboard(\Illuminate\Http\Request $request)
    {
        $filters = $request->validate(['categoria_id' => 'nullable|integer|min:1', 'marca_id' => 'nullable|integer|min:1', 'variante_id' => 'nullable|integer|min:1', 'q' => 'nullable|string|max:100']);
        $data = $this->inventoryService->getDashboardData($filters);
        $data['logoUrl'] = ConfiguracionSitio::obtener('logo_url');
        $data['usuario_nombre'] = auth()->user()?->nombre_completo ?? auth()->user()?->nombres ?? 'Administrador';
        
        return Inertia::render('Admin/Inventario/Dashboard', $data);
    }

    public function movimientos(\Illuminate\Http\Request $request)
    {
        $request->validate(['source' => 'nullable|in:current,legacy', 'tipo' => 'nullable|string|max:50', 'almacen_id' => 'nullable|string|max:20']);
        if ($request->input('source') === 'legacy') {
            $legacy = \Illuminate\Support\Facades\DB::table('movimientos_almacen as j')
                ->leftJoin('variante as v', 'v.id', '=', 'j.variante_id')->leftJoin('producto as p', 'p.id', '=', 'v.producto_id')
                ->leftJoin('almacenes as a', 'a.id', '=', 'j.almacen_id')->leftJoin('usuario as u', 'u.id', '=', 'j.usuario_id')
                ->select('j.*', 'v.sku', 'p.nombre as product_name', 'a.nombre as warehouse_name', 'u.nombres as actor_name');
            if ($request->filled('almacen_id') && $request->almacen_id !== 'todos') $legacy->where('j.almacen_id', $request->almacen_id);
            if ($request->filled('tipo') && $request->tipo !== 'todos') $legacy->where('j.tipo', $request->tipo);
            $movimientos = $legacy->orderByDesc('j.created_at')->orderByDesc('j.id')->paginate(20)->withQueryString();
            $movimientos->through(fn ($row) => ['id' => $row->id, 'tipo' => $row->tipo,
                'cantidad' => $row->tipo === 'entrada' ? $row->cantidad : -abs($row->cantidad), 'stock_anterior' => null, 'stock_nuevo' => null,
                'created_at' => $row->created_at, 'motivo' => $row->referencia ?? 'Movimiento histórico',
                'variante' => ['sku' => $row->sku, 'producto' => ['nombre' => $row->product_name]], 'almacen' => ['nombre' => $row->warehouse_name], 'usuario' => ['nombres' => $row->actor_name]]);
            return Inertia::render('Admin/Inventario/Movimientos', ['movimientos' => $movimientos,
                'almacenes' => \App\Models\Almacen::select('id', 'nombre')->get(), 'filters' => $request->only(['almacen_id', 'tipo', 'source']),
                'logoUrl' => ConfiguracionSitio::obtener('logo_url'), 'usuario_nombre' => auth()->user()?->nombre_completo ?? auth()->user()?->nombres ?? 'Administrador']);
        }
        $query = \App\Models\InventarioMovimiento::with(['variante.producto', 'almacen', 'usuario'])
            ->orderBy('created_at', 'desc');

        if ($request->has('almacen_id') && $request->almacen_id !== 'todos') {
            $query->where('almacen_id', $request->almacen_id);
        }

        if ($request->has('tipo') && $request->tipo !== 'todos') {
            $query->where('tipo', $request->tipo);
        }

        $movimientos = $query->paginate(20)->withQueryString();
        
        $almacenes = \App\Models\Almacen::where('activo', 1)->select('id', 'nombre')->get();

        return Inertia::render('Admin/Inventario/Movimientos', [
            'movimientos' => $movimientos,
            'almacenes' => $almacenes,
            'filters' => $request->only(['almacen_id', 'tipo', 'source']),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
            'usuario_nombre' => auth()->user()?->nombre_completo ?? auth()->user()?->nombres ?? 'Administrador',
        ]);
    }

    public function ajustarStock(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'variante_id' => 'required|exists:variante,id',
            'almacen_id' => 'required|exists:almacenes,id',
            'tipo' => 'required|in:entrada,salida,ajuste',
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'required|string|max:255',
            'operacion_ajuste' => 'required_if:tipo,ajuste|in:suma,resta',
            'operation_key' => 'required|uuid',
        ]);

        try {
            // Determinar si la cantidad suma o resta
            $cantidadReal = $request->cantidad;
            if ($request->tipo === 'salida' || ($request->tipo === 'ajuste' && $request->input('operacion_ajuste') === 'resta')) {
                $cantidadReal = -$request->cantidad;
            }

            $this->inventoryWriter->registrarMovimiento(
                varianteId: (int) $request->variante_id,
                almacenId: (int) $request->almacen_id,
                cantidad: $cantidadReal,
                tipo: $request->tipo,
                motivo: $request->motivo,
                usuarioId: (int) (auth('admin')->id() ?? auth()->id() ?? 1),
                operationKey: 'manual:'.$request->operation_key
            );

            return back()->with('success', 'Movimiento registrado correctamente en el Kardex.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
