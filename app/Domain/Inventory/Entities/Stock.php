<?php
namespace App\Domain\Inventory\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Stock entity linking a Product with a Warehouse.
 */
class Stock extends Entity
{
    protected $table = 'stocks';

    protected $fillable = [
        'product_variant_id',
        'quantity',
        'reserved',
        'location_id',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Catalog\Entities\Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'location_id');
    }
}
?>
