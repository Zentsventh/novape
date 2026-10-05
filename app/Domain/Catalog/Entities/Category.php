<?php
namespace App\Domain\Catalog\Entities;

use App\Domain\Shared\Entity;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Category entity with hierarchical support.
 */
class Category extends Entity
{
    protected $table = 'categories';

    protected $fillable = [
        'name',
        'slug',
        'parent_id',
        'description',
        'image_path',
        'seo_title',
        'seo_description',
        'status', // active / inactive
    ];

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }
}
?>
