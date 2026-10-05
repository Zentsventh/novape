<?php
namespace App\Domain\Inventory\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Warehouse entity representing a physical storage location.
 */
class Warehouse extends Entity
{
    protected $table = 'warehouses';

    protected $fillable = [
        'code',          // Unique warehouse code
        'name',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'status', // active / inactive
    ];

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class, 'location_id');
    }
}
?>
