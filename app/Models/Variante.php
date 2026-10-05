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

    protected $fillable = [
        'producto_id',
        'sku',
        'precio',
        'precio_anterior',
        'activo',
        'stock',
        'stock_reservado',
        'peso', 'precio_compra', 'stock_minimo', 'stock_maximo', 'stock_seguridad',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'precio_anterior' => 'decimal:2',
        'activo' => 'boolean',
        'stock' => 'integer',
        'stock_reservado' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

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
}
