<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Variante extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'variante';

    protected static function booted(): void
    {
        $history = function (self $variant) {
            if ($variant->wasRecentlyCreated || $variant->wasChanged('precio')) {
                \Illuminate\Support\Facades\DB::table('historial_precio')->where('variante_id', $variant->id)->whereNull('fecha_fin')->update(['fecha_fin' => now(), 'updated_at' => now()]);
                \Illuminate\Support\Facades\DB::table('historial_precio')->insert(['variante_id' => $variant->id, 'precio' => $variant->precio,
                    'fecha_inicio' => now(), 'usuario_id' => auth('admin')->id(), 'motivo' => $variant->wasRecentlyCreated ? 'Precio inicial' : 'Actualización de precio', 'created_at' => now(), 'updated_at' => now()]);
            }
        };
        static::created($history);
        static::updated($history);
    }

    protected $fillable = [
        'producto_id',
        'sku',
        'precio',
        'precio_anterior',
        'activo',
        'stock',
        'stock_reservado',
        'peso', 'precio_compra', 'stock_minimo', 'stock_maximo', 'stock_seguridad',
        'shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'precio_compra' => 'decimal:4',
        'precio_anterior' => 'decimal:2',
        'activo' => 'boolean',
        'stock' => 'integer',
        'stock_reservado' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /** @return BelongsTo<Producto, $this> */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    /**
     * Scope to get only active variants.
     */
    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    public function getPrecioFinalAttribute()
    {
        return \App\Services\Storefront\VariantPricing::quote($this)['price'];
    }
}
