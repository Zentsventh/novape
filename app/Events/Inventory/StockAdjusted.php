<?php
namespace App\Events\Inventory;

use App\Domain\Inventory\Entities\Stock;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockAdjusted
{
    use Dispatchable, SerializesModels;

    public Stock $stock;
    public array $adjustments;

    public function __construct(Stock $stock, array $adjustments)
    {
        $this->stock = $stock;
        $this->adjustments = $adjustments;
    }
}
?>
