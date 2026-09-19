<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class Producto extends Model
{
    use SoftDeletes;

    protected $table = 'producto';

    protected $fillable = [
        'nombre',
        'slug',
        'descripcion',
        'marca_id',
        'proveedor_id',
        'activo',
        'tipo_afectacion_igv',
        'garantias',
        'sku_base'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (self $producto) {
            if (empty($producto->slug)) {
                $baseSlug = Str::slug($producto->nombre);
                $slug = $baseSlug;
                $count = 1;
                while (static::withTrashed()->where('slug', $slug)->where('id', '!=', $producto->id)->exists()) {
                    $slug = $baseSlug . '-' . $count;
                    $count++;
                }
                $producto->slug = $slug;
            }
        });

        $clearCache = function () {
            Cache::forget('home_categorias');
            Cache::forget('home_mejor_semana');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function categorias(): BelongsToMany
    {
        return $this->belongsToMany(Categoria::class, 'producto_categoria', 'producto_id', 'categoria_id');
    }

    public function variantes(): HasMany
    {
        return $this->hasMany(Variante::class, 'producto_id');
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(ProductoImagen::class, 'producto_id')->orderBy('orden');
    }

    public function productoEspecificaciones(): HasMany
    {
        return $this->hasMany(ProductoEspecificacion::class, 'producto_id');
    }

    /**
     * Scope to get only active products.
     */
    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }
}
