<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use SoftDeletes;
    protected $table = 'categoria';

    protected static function boot()
    {
        parent::boot();

        static::saving(function (self $category) {
            if (! $category->isDirty('categoria_padre_id')) return;
            $seen = $category->exists ? [(int) $category->id => true] : [];
            $parent = $category->categoria_padre_id;
            while ($parent) {
                if (isset($seen[(int) $parent])) {
                    throw \Illuminate\Validation\ValidationException::withMessages(['categoria_padre_id' => 'La categoría no puede formar un ciclo con sus descendientes.']);
                }
                $seen[(int) $parent] = true;
                $parent = self::withTrashed()->whereKey($parent)->value('categoria_padre_id');
            }
        });

        $clearCache = function () {
            \Illuminate\Support\Facades\Cache::forget('home_category_product_ids_v2');
            \Illuminate\Support\Facades\Cache::forget('home_weekly_product_ids_v2');
            \Illuminate\Support\Facades\Cache::forget('home_categorias');
            \Illuminate\Support\Facades\Cache::forget('home_mejor_semana');
            \Illuminate\Support\Facades\Cache::forget('catalog_categorias_base');
            \Illuminate\Support\Facades\Cache::forget('home_categorias_menu');
            \Illuminate\Support\Facades\Cache::forget('home_categorias_menu_v3');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    protected $fillable = ['nombre', 'descripcion', 'categoria_padre_id'];

    public function padre(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'categoria_padre_id');
    }

    public function hijos(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Categoria::class, 'categoria_padre_id');
    }

    public function subcategorias(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Categoria::class, 'categoria_padre_id');
    }

    public function productos(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Producto::class, 'producto_categoria', 'categoria_id', 'producto_id');
    }
}
