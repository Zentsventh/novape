<?php
namespace App\Domain\Inventory\Repositories;

use App\Domain\Shared\BaseRepository;
use App\Domain\Inventory\Entities\Stock;

/**
 * Repositorio Eloquent para Stock.
 */
class EloquentStockRepository extends BaseRepository implements StockRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new Stock());
    }
}
?>
