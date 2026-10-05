<?php
namespace App\Http\Controllers\Api\V1\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\Inventory\StoreWarehouseRequest;
use App\Http\Requests\Inventory\UpdateWarehouseRequest;
use App\Domain\Inventory\Services\WarehouseService;
use App\Http\Resources\Inventory\WarehouseResource;
use Illuminate\Http\JsonResponse;

class WarehouseController extends Controller
{
    public function __construct(private WarehouseService $service) {}

    /**
     * Lista todos los almacenes.
     */
    public function index(): JsonResponse
    {
        $warehouses = $this->service->list();
        return response()->json(WarehouseResource::collection($warehouses));
    }

    /**
     * Crea un nuevo almacén.
     */
    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        $warehouse = $this->service->create($request->validated());
        return response()->json(new WarehouseResource($warehouse), 201);
    }

    /**
     * Muestra un almacén por ID.
     */
    public function show(string $id): JsonResponse
    {
        $warehouse = $this->service->find($id);
        return response()->json(new WarehouseResource($warehouse));
    }

    /**
     * Actualiza un almacén existente.
     */
    public function update(UpdateWarehouseRequest $request, string $id): JsonResponse
    {
        $warehouse = $this->service->update($id, $request->validated());
        return response()->json(new WarehouseResource($warehouse));
    }

    /**
     * Elimina un almacén.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
?>
