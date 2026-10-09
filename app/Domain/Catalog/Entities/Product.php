<?php
namespace App\Domain\Catalog\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Product entity representing a sellable item.
 */
class Product extends Entity
{
    protected $table = 'products';

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'short_description',
        'full_description',
        'brand_id',
        'category_id',
        'price',
        'cost',
        'stock',
        'status', // active, inactive, archived
        'is_featured',
    ];

    // Relationships
    public function brand(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Catalog\Entities\Brand::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(\App\Domain\Catalog\Entities\Category::class);
    }
}
?>
