<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use OwenIt\Auditing\Contracts\Auditable;

class Producto extends Model implements Auditable
{
    use HasFactory, \OwenIt\Auditing\Auditable, SoftDeletes;

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
        'fuente_url',
        'fuente_consultada_at',
        'sku_base',
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
                    $slug = $baseSlug.'-'.$count;
                    $count++;
                }
                $producto->slug = $slug;
            }
        });

        $clearCache = function () {
            \Illuminate\Support\Facades\Cache::forget('home_category_product_ids_v2');
            \Illuminate\Support\Facades\Cache::forget('home_weekly_product_ids_v2');
            Cache::forget('home_categorias');
            Cache::forget('home_mejor_semana');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    /** @return BelongsTo<Marca, $this> */
    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    /** @return BelongsTo<Proveedor, $this> */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /** @return BelongsToMany<Categoria, $this> */
    public function categorias(): BelongsToMany
    {
        return $this->belongsToMany(Categoria::class, 'producto_categoria', 'producto_id', 'categoria_id');
    }

    /** @return HasMany<Variante, $this> */
    public function variantes(): HasMany
    {
        return $this->hasMany(Variante::class, 'producto_id');
    }

    /** @return HasMany<ProductoImagen, $this> */
    public function imagenes(): HasMany
    {
        return $this->hasMany(ProductoImagen::class, 'producto_id')->orderBy('orden');
    }

    /** @return HasMany<ProductoEspecificacion, $this> */
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
