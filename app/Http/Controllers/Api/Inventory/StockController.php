<?php
namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Domain\Inventory\Services\StockService;
use App\Domain\Inventory\Entities\Stock;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    protected StockService $service;

    public function __construct(StockService $service)
    {
        $this->service = $service;
    }

    /**
     * List all stock entries (paginated).
     */
    public function index(): JsonResponse
    {
        $stocks = Stock::paginate(20);
        return response()->json($stocks);
    }

    /**
     * Store a new stock record.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_variant_id' => 'required|uuid',
            'quantity' => 'required|integer|min:0',
            'reserved' => 'integer|min:0',
            'location_id' => 'nullable|uuid',
        ]);
        $stock = $this->service->create($data);
        return response()->json($stock, 201);
    }

    /**
     * Show a specific stock entry.
     */
    public function show(string $id): JsonResponse
    {
        $stock = $this->service->repo->find($id);
        if (! $stock) {
            return response()->json(['message' => 'Not found'], 404);
        }
        return response()->json($stock);
    }

    /**
     * Update a stock entry.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'quantity' => 'sometimes|integer|min:0',
            'reserved' => 'sometimes|integer|min:0',
            'location_id' => 'sometimes|nullable|uuid',
        ]);
        $stock = $this->service->update($id, $data);
        return response()->json($stock);
    }

    /**
     * Delete a stock entry.
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = $this->service->delete($id);
        return $deleted ? response()->noContent() : response()->json(['message' => 'Not found'], 404);
    }

    /**
     * Adjust quantity/reserved of a stock entry.
     */
    public function adjust(Request $request, string $id): JsonResponse
    {
        $adjustments = $request->validate([
            'quantity' => 'sometimes|integer',
            'reserved' => 'sometimes|integer',
        ]);
        $stock = $this->service->adjust($id, $adjustments);
        return response()->json($stock);
    }
}
?>
