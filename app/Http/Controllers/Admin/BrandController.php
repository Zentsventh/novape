<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\StoreBrandRequest;
use App\Http\Requests\Admin\Catalog\UpdateBrandRequest;
use App\Services\Admin\Catalog\CatalogManagementService;
use Inertia\Inertia;
use App\Models\Marca;

class BrandController extends Controller
{
    public function __construct(
        private readonly CatalogManagementService $catalogService
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Marcas/Index', [
            'marcas' => $this->catalogService->getBrands()
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Marcas/Form');
    }

    public function store(StoreBrandRequest $request)
    {
        $this->catalogService->createBrand($request->validated());
        return redirect()->route('admin.marcas')->with('success', 'Marca creada exitosamente.');
    }

    public function edit(int $id)
    {
        return Inertia::render('Admin/Marcas/Form', [
            'marca' => Marca::findOrFail($id)
        ]);
    }

    public function update(UpdateBrandRequest $request, int $id)
    {
        $this->catalogService->updateBrand(Marca::findOrFail($id), $request->validated());
        return redirect()->route('admin.marcas')->with('success', 'Marca actualizada exitosamente.');
    }

    public function destroy(int $id)
    {
        $this->catalogService->deleteBrand(Marca::findOrFail($id));
        return redirect()->route('admin.marcas')->with('success', 'Marca eliminada exitosamente.');
    }
}
