<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\StoreCategoryRequest;
use App\Http\Requests\Admin\Catalog\UpdateCategoryRequest;
use App\Services\Admin\Catalog\CatalogManagementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Categoria;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CatalogManagementService $catalogService
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Categorias/Index', [
            'categorias' => $this->catalogService->getCategories()
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Categorias/Form', [
            'categoriasPadre' => $this->catalogService->getParentCategories()
        ]);
    }

    public function store(StoreCategoryRequest $request)
    {
        $this->catalogService->createCategory($request->validated());
        return redirect()->route('admin.categorias')->with('success', 'Categoría creada exitosamente.');
    }

    public function storeApi(StoreCategoryRequest $request)
    {
        $categoria = $this->catalogService->createCategory($request->validated());
        return response()->json([
            'success' => true,
            'categoria' => $categoria
        ]);
    }

    public function edit(int $id)
    {
        return Inertia::render('Admin/Categorias/Form', [
            'categoria' => Categoria::findOrFail($id),
            'categoriasPadre' => $this->catalogService->getParentCategories($id)
        ]);
    }

    public function update(UpdateCategoryRequest $request, int $id)
    {
        $this->catalogService->updateCategory(Categoria::findOrFail($id), $request->validated());
        return redirect()->route('admin.categorias')->with('success', 'Categoría actualizada exitosamente.');
    }

    public function destroy(int $id)
    {
        $this->catalogService->deleteCategory(Categoria::findOrFail($id));
        return redirect()->route('admin.categorias')->with('success', 'Categoría eliminada exitosamente.');
    }
}
