<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Services\ProductService;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected ProductService $service;

    public function __construct(ProductService $service)
    {
        $this->service = $service;
    }

    /**
     * List paginated products.
     */
    public function index()
    {
        return Producto::paginate(20);
    }

    /**
     * Store a new product.
     */
    public function store(StoreProductRequest $request)
    {
        $product = $this->service->create($request->validated());
        return response()->json($product, 201);
    }

    /**
     * Show a specific product.
     */
    public function show($id)
    {
        $product = $this->service->find((int) $id);
        if (! $product) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return $product;
    }

    /**
     * Update a product.
     */
    public function update(UpdateProductRequest $request, $id)
    {
        $product = $this->service->update((int) $id, $request->validated());
        if (! $product) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($product);
    }

    /**
     * Delete a product.
     */
    public function destroy($id)
    {
        $deleted = $this->service->delete((int) $id);
        return $deleted ? response()->noContent() : response()->json(['message' => 'Not found'], 404);
    }

    /**
     * Search products.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        $perPage = $request->input('per_page', 20);
        $results = $this->service->search($query, $perPage);
        return $results;
    }
}
?>
