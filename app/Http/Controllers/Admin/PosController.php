<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Pos\ProcessPosSaleRequest;
use App\Models\ConfiguracionSitio;
use App\Services\Admin\Pos\PosService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PosController extends Controller
{
    public function __construct(
        private readonly PosService $posService
    ) {}

    public function index()
    {
        $userId = auth()->id();
        $cajaAbierta = $this->posService->getActiveRegister($userId);
        $almacenId = $cajaAbierta && empty($cajaAbierta->almacen_id) ? 0 : $this->posService->getWarehouseIdForRegister($cajaAbierta);
        $productos = $this->posService->getProducts($almacenId);

        $metodosPago = DB::table('metodos_pago')->where('activo', true)->get();
        $categorias = DB::table('categoria')->where('activa', true)->whereNull('categoria_padre_id')->orderBy('nombre')->pluck('nombre');

        $ventasHoy = DB::table('ventas_pos')->whereDate('created_at', now()->toDateString())->sum('total');
        $ticketsHoy = DB::table('ventas_pos')->whereDate('created_at', now()->toDateString())->count();

        $ventasCajaTotal = 0;
        $ventasCajaEfectivo = 0;
        $cajaIngresos = 0;
        $cajaEgresos = 0;

        if ($cajaAbierta) {
            $ventasCajaTotal = DB::table('ventas_pos')->where('caja_sesion_id', $cajaAbierta->id)->sum('total');
            $ventasCajaEfectivo = DB::table('venta_pos_pagos')
                ->join('ventas_pos', 'venta_pos_pagos.venta_pos_id', '=', 'ventas_pos.id')
                ->join('metodos_pago', 'venta_pos_pagos.metodo_pago_id', '=', 'metodos_pago.id')
                ->where('ventas_pos.caja_sesion_id', $cajaAbierta->id)
                ->where('metodos_pago.nombre', 'LIKE', '%Efectivo%')
                ->sum('venta_pos_pagos.monto');

            $cajaIngresos = DB::table('caja_movimientos')->where('caja_sesion_id', $cajaAbierta->id)->where('tipo', 'ingreso')->sum('monto');
            $cajaEgresos = DB::table('caja_movimientos')->where('caja_sesion_id', $cajaAbierta->id)->where('tipo', 'egreso')->sum('monto');
        }

        return Inertia::render('Admin/Pos/Index', [
            'productos' => $productos,
            'cajaRequiereCierre' => $cajaAbierta && empty($cajaAbierta->almacen_id),
            'cajas' => DB::table('cajas')->join('sucursales', 'sucursales.id', '=', 'cajas.sucursal_id')->whereNull('cajas.deleted_at')->whereNull('sucursales.deleted_at')->whereNotNull('sucursales.almacen_id')->select('cajas.id', 'cajas.nombre', 'sucursales.nombre as sucursal_nombre')->get(),
            'categorias' => $categorias,
            'metodosPago' => $metodosPago,
            'ventasHoy' => (float) $ventasHoy,
            'ticketsHoy' => $ticketsHoy,
            'cajaAbierta' => $cajaAbierta,
            'cajaIngresos' => $cajaIngresos,
            'cajaEgresos' => $cajaEgresos,
            'ventasCajaTotal' => (float) $ventasCajaTotal,
            'ventasCajaEfectivo' => (float) $ventasCajaEfectivo,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
            'igv_porcentaje' => (float) ConfiguracionSitio::obtener('igv_porcentaje', '18'),
        ]);
    }

    public function historial(Request $request)
    {
        $query = DB::table('ventas_pos')
            ->leftJoin('usuario', 'usuario.id', '=', 'ventas_pos.cajero_id')
            ->leftJoin('clientes', 'clientes.id', '=', 'ventas_pos.cliente_id')
            ->leftJoin('metodos_pago', 'metodos_pago.id', '=', 'ventas_pos.metodo_pago_id')
            ->select(
                'ventas_pos.id',
                'ventas_pos.codigo_ticket',
                'ventas_pos.total',
                'ventas_pos.created_at',
                'ventas_pos.tipo_comprobante',
                'usuario.nombres as cajero_nombre',
                'clientes.nombre_razon_social as cliente_nombre',
                'metodos_pago.nombre as metodo_pago'
            );

        if (! auth()->user()->esAdmin()) {
            $query->where('ventas_pos.cajero_id', auth()->id());
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('ventas_pos.codigo_ticket', 'like', "%{$search}%")
                    ->orWhere('clientes.nombre_razon_social', 'like', "%{$search}%");
            });
        }

        return Inertia::render('Admin/Pos/Historial', [
            'historial' => $query->orderBy('ventas_pos.created_at', 'desc')->paginate(15),
            'filters' => $request->only(['search']),
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]);
    }

    public function registrarVenta(ProcessPosSaleRequest $request)
    {
        try {
            $result = $this->posService->processSale($request->validated(), auth()->id());

            return redirect()->back()->with('success', "Venta {$result['codigo_ticket']} registrada. Total: S/ {$result['total']}")->with('venta_id', $result['venta_id']);
        } catch (\Exception $e) {
            Log::error('POS Error: '.$e->getMessage());

            return redirect()->back()->withErrors(['cliente' => $e->getMessage()])->with('error', 'Error al procesar la venta: '.$e->getMessage());
        }
    }

    public function buscarCliente(Request $request)
    {
        if (! $request->query('numero_documento')) {
            return response()->json(['error' => 'Documento requerido'], 400);
        }

        return response()->json($this->posService->findClientFromApi($request->query('tipo_documento', 'DNI'), $request->query('numero_documento')));
    }

    public function imprimirTicket($id)
    {
        $venta = DB::table('ventas_pos')
            ->leftJoin('clientes', 'ventas_pos.cliente_id', '=', 'clientes.id')
            ->leftJoin('usuario', 'ventas_pos.cajero_id', '=', 'usuario.id')
            ->select('ventas_pos.*', 'clientes.nombre_razon_social as cliente_nombre', 'clientes.numero_documento as cliente_doc', 'clientes.direccion as cliente_direccion', 'usuario.nombres as cajero_nombre')
            ->where('ventas_pos.id', $id)
            ->first();

        if (! $venta) {
            abort(404, 'Ticket no encontrado');
        }

        abort_unless(auth()->user()->esAdmin() || (int) $venta->cajero_id === (int) auth()->id(), 403);
        $snapshot = $venta->invoice_snapshot ? json_decode($venta->invoice_snapshot, true) : [];
        foreach (['nombre_razon_social' => 'cliente_nombre', 'numero_documento' => 'cliente_doc', 'direccion' => 'cliente_direccion'] as $source => $target) {
            if (isset($snapshot['cliente'][$source])) {
                $venta->$target = $snapshot['cliente'][$source];
            }
        }
        $items = DB::table('venta_pos_items')->where('venta_pos_id', $id)->get();

        return view('admin.pos.ticket', [
            'venta' => $venta,
            'items' => $items,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
            'nombreTienda' => ConfiguracionSitio::obtener('nombre_tienda') ?: 'NOVAPE STORE',
        ]);
    }

    public function buscarProductos(Request $request)
    {
        $cajaAbierta = $this->posService->getActiveRegister(auth()->id());
        $almacenId = $cajaAbierta && empty($cajaAbierta->almacen_id) ? 0 : $this->posService->getWarehouseIdForRegister($cajaAbierta);

        $productos = $this->posService->getProducts(
            $almacenId,
            $request->input('search'),
            $request->input('categoria')
        );

        return response()->json(['success' => true, 'data' => $productos]);
    }
}
