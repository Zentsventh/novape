<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Variante extends Model
{
    use SoftDeletes, HasFactory;

    protected $table = 'variante';

    protected $fillable = [
        'producto_id', 
        'sku', 
        'precio', 
        'activo', 
        'stock', 
        'stock_reservado'
    ];

    protected $casts = [
        'precio' => 'decimal:2',
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
