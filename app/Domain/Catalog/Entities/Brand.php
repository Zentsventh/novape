<?php
namespace App\Domain\Catalog\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Brand entity representing a product manufacturer.
 */
class Brand extends Entity
{
    protected $table = 'brands';

    protected $fillable = [
        'name',
        'logo_path',
        'description',
        'status', // active / inactive
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
?>
