<?php
namespace App\Domain\Inventory\Repositories;

use App\Domain\Shared\BaseRepository;
use App\Domain\Inventory\Entities\Warehouse;

/**
 * Repositorio Eloquent para almacenes.
 */
class EloquentWarehouseRepository extends BaseRepository implements WarehouseRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new Warehouse());
    }
}
?>
