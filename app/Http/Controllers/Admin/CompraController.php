<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Compra\StorePurchaseRequest;
use App\Services\Admin\SupplyChain\SupplyChainService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\ConfiguracionSitio;

class CompraController extends Controller
{
    public function __construct(
        private readonly SupplyChainService $supplyChainService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['proveedor_id', 'estado', 'categoria_id', 'marca_id', 'producto_id', 'search']);
        $data = $this->supplyChainService->getIndexData($filters);

        return Inertia::render('Admin/Compras/Index', array_merge($data, [
            'filters' => $filters,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url')
        ]));
    }

    public function show(int $id)
    {
        $compra = DB::table('compras')
            ->leftJoin('proveedor', 'compras.proveedor_id', '=', 'proveedor.id')
            ->select('compras.*', 'proveedor.nombre as proveedor_nombre', 'proveedor.email as proveedor_email', 'proveedor.telefono as proveedor_telefono')
            ->where('compras.id', $id)
            ->first();

        if (!$compra) abort(404);

        $items = DB::table('compra_items')
            ->leftJoin('producto', 'compra_items.producto_id', '=', 'producto.id')
            ->leftJoin('variante', 'compra_items.variante_id', '=', 'variante.id')
            ->select('compra_items.*', 'producto.nombre as producto_nombre', 'variante.sku')
            ->where('compra_items.compra_id', $id)
            ->get();

        return Inertia::render('Admin/Compras/Show', [
            'compra' => $compra,
            'items' => $items,
            'logoUrl' => ConfiguracionSitio::obtener('logo_url'),
        ]);
    }

    public function store(StorePurchaseRequest $request)
    {
        try {
            $message = $this->supplyChainService->createPurchaseOrder($request->validated());
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error al crear la orden: ' . $e->getMessage());
        }
    }

    public function completar(int $id)
    {
        try {
            $adminId = (int) (auth('admin')->id() ?? auth()->id() ?? 1);
            $this->supplyChainService->completePurchaseOrder($id, $adminId);
            return redirect()->back()->with('success', 'Compra completada. Inventario actualizado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Error al completar la compra: ' . $e->getMessage());
        }
    }

    public function destroy(int $id)
    {
        try {
            $this->supplyChainService->deletePurchaseOrder($id);
            return redirect()->back()->with('success', 'Orden de compra eliminada.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
