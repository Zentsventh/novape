<?php
namespace App\Domain\Inventory\Services;

use App\Domain\Inventory\Entities\Stock;
use App\Domain\Inventory\Repositories\StockRepositoryInterface;
use App\Events\Inventory\StockCreated;
use App\Events\Inventory\StockUpdated;
use App\Events\Inventory\StockAdjusted;
use App\Domain\Shared\BaseService;

class StockService extends BaseService
{
    public function __construct(private StockRepositoryInterface $repo) {}

    /**
     * Crea un registro de stock.
     */
    public function create(array $data): Stock
    {
        $stock = $this->repo->create($data);
        $this->dispatch(new StockCreated($stock));
        $this->logInfo('Stock created', ['id' => $stock->getKey()]);
        return $stock;
    }

    /**
     * Actualiza un registro de stock.
     */
    public function update(string $id, array $data): Stock
    {
        $stock = $this->repo->update($id, $data);
        $this->dispatch(new StockUpdated($stock));
        $this->logInfo('Stock updated', ['id' => $id]);
        return $stock;
    }

    /**
     * Ajusta la cantidad disponible y/o reservada.
     * $adjustments = ['quantity' => int, 'reserved' => int]
     */
    public function adjust(string $id, array $adjustments): Stock
    {
        $stock = $this->repo->find($id);
        if (!$stock) {
            throw new \RuntimeException('Stock not found');
        }
        $data = [];
        if (isset($adjustments['quantity'])) {
            $stock->quantity = $adjustments['quantity'];
            $data['quantity'] = $adjustments['quantity'];
        }
        if (isset($adjustments['reserved'])) {
            $stock->reserved = $adjustments['reserved'];
            $data['reserved'] = $adjustments['reserved'];
        }
        $stock->save();
        $this->dispatch(new StockAdjusted($stock, $adjustments));
        $this->logInfo('Stock adjusted', ['id' => $id, 'adjustments' => $adjustments]);
        return $stock;
    }

    public function delete(string $id): bool
    {
        $result = $this->repo->delete($id);
        $this->logInfo('Stock deleted', ['id' => $id]);
        return $result;
    }
}
?>
