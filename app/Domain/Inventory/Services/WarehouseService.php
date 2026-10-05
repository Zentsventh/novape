<?php
namespace App\Domain\Inventory\Services;

use App\Domain\Inventory\Entities\Warehouse;
use App\Domain\Inventory\Repositories\WarehouseRepositoryInterface;
use App\Events\Inventory\WarehouseCreated;
use App\Events\Inventory\WarehouseUpdated;
use App\Domain\Shared\BaseService;

class WarehouseService extends BaseService
{
    public function __construct(private WarehouseRepositoryInterface $repo) {}

    public function create(array $data): Warehouse
    {
        // Validaciones básicas (p.ej. código único) pueden ir en FormRequest
        $warehouse = $this->repo->create($data);
        $this->dispatch(new WarehouseCreated($warehouse));
        $this->logInfo('Warehouse created', ['id' => $warehouse->getKey()]);
        return $warehouse;
    }

    public function update(string $id, array $data): Warehouse
    {
        $warehouse = $this->repo->update($id, $data);
        $this->dispatch(new WarehouseUpdated($warehouse));
        $this->logInfo('Warehouse updated', ['id' => $id]);
        return $warehouse;
    }

    public function delete(string $id): bool
    {
        $result = $this->repo->delete($id);
        $this->logInfo('Warehouse deleted', ['id' => $id]);
        return $result;
    }
}
?>
