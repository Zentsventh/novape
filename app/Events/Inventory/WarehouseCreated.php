<?php
namespace App\Events\Inventory;

use App\Domain\Inventory\Entities\Warehouse;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WarehouseCreated
{
    use Dispatchable, SerializesModels;

    public Warehouse $warehouse;

    public function __construct(Warehouse $warehouse)
    {
        $this->warehouse = $warehouse;
    }
}
?>
