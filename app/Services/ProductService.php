<?php

namespace App\Services;

use App\Models\Producto;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProductService
{
    /**
     * Retrieve a product by its ID.
     */
    public function find(int $id): ?Producto
    {
        return Producto::find($id);
    }

    /**
     * Create a new product.
     */
    public function create(array $data): Producto
    {
        // Validation should be performed in FormRequest
        return Producto::create($data);
    }

    /**
     * Update an existing product.
     */
    public function update(int $id, array $data): ?Producto
    {
        $product = $this->find($id);
        if ($product) {
            $product->update($data);
        }

        return $product;
    }

    /**
     * Delete a product.
     */
    public function delete(int $id): bool
    {
        $product = $this->find($id);
        if ($product) {
            return $product->delete();
        }

        return false;
    }

    /**
     * Search the catalog without depending on an unconfigured Scout driver.
     */
    public function search(string $query, int $perPage = 20): LengthAwarePaginator
    {
        return Producto::query()->where('activo', true)
            ->where(fn ($q) => $q->where('nombre', 'like', '%'.$query.'%')->orWhere('sku_base', 'like', '%'.$query.'%'))
            ->orderBy('nombre')->paginate(max(1, min($perPage, 100)));
    }
}
