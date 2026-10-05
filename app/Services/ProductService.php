<?php

namespace App\Services;

use App\Models\Producto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

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
     * Search products using Laravel Scout.
     */
    public function search(string $query, int $perPage = 20): Builder
    {
        // Assuming Producto uses the Searchable trait
        return Producto::search($query)->query()->paginate($perPage);
    }
}
?>
