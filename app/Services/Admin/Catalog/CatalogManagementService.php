<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalog;

use App\Models\Marca;
use App\Models\Categoria;
use Illuminate\Database\Eloquent\Collection;

class CatalogManagementService
{
    public function getBrands(): Collection
    {
        return Marca::withCount('productos')->orderBy('id', 'desc')->get();
    }

    public function createBrand(array $data): Marca
    {
        return Marca::create($data);
    }

    public function updateBrand(Marca $marca, array $data): Marca
    {
        $marca->update($data);
        return $marca;
    }

    public function deleteBrand(Marca $marca): void
    {
        $marca->delete();
    }

    public function getCategories(): Collection
    {
        return Categoria::with('padre')
            ->withCount('productos')
            ->orderBy('id', 'desc')
            ->get();
    }

    public function getParentCategories(int $excludeId = null): Collection
    {
        $query = Categoria::whereNull('categoria_padre_id');
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }
        return $query->get();
    }

    public function createCategory(array $data): Categoria
    {
        return Categoria::create($data);
    }

    public function updateCategory(Categoria $categoria, array $data): Categoria
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($categoria, $data) {
            // Serialize hierarchy edits so two simultaneous reparents cannot form a cycle.
            \Illuminate\Support\Facades\DB::table('categoria')->orderBy('id')->lockForUpdate()->get(['id']);
            $categoria->update($data);
            return $categoria;
        });
    }

    public function deleteCategory(Categoria $categoria): void
    {
        $categoria->delete();
    }
}
