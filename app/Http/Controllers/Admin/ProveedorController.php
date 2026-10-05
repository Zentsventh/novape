<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Warehouse\StoreSupplierRequest;
use App\Models\Proveedor;
use App\Services\Admin\Warehouse\SupplierService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    public function __construct(
        private readonly SupplierService $supplierService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search', 'sort', 'direction']);
        $proveedores = $this->supplierService->getSuppliers($filters);

        return Inertia::render('Admin/Proveedores/Index', [
            'proveedores' => $proveedores->withQueryString(),
            'filters' => (object) $filters,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Proveedores/Form', [
            'proveedor' => null,
        ]);
    }

    public function store(StoreSupplierRequest $request)
    {
        $this->supplierService->createSupplier($request->validated());

        return redirect()->route('proveedores.index')->with('success', 'Proveedor creado exitosamente.');
    }

    public function edit(int $id)
    {
        return Inertia::render('Admin/Proveedores/Form', [
            'proveedor' => Proveedor::findOrFail($id),
        ]);
    }

    public function show(int $id)
    {
        Proveedor::findOrFail($id);

        return redirect()->route('proveedores.edit', $id);
    }

    public function update(StoreSupplierRequest $request, int $id)
    {
        $this->supplierService->updateSupplier(Proveedor::findOrFail($id), $request->validated());

        return redirect()->route('proveedores.index')->with('success', 'Proveedor actualizado exitosamente.');
    }

    public function destroy(int $id)
    {
        $this->supplierService->deleteSupplier(Proveedor::findOrFail($id));

        return redirect()->route('proveedores.index')->with('success', 'Proveedor eliminado exitosamente.');
    }
}
