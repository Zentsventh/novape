<?php
namespace App\Events\Inventory;

use App\Domain\Inventory\Entities\Stock;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockCreated
{
    use Dispatchable, SerializesModels;

    public Stock $stock;

    public function __construct(Stock $stock)
    {
        $this->stock = $stock;
    }
}
?>
