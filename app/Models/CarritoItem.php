<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class CarritoItem extends Model
{
    protected $table = 'carrito_item';

    protected $fillable = [
        'carrito_id',
        'variante_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** @return BelongsTo<Carrito, $this> */
    public function carrito(): BelongsTo
    {
        return $this->belongsTo(Carrito::class, 'carrito_id');
    }

    /** @return BelongsTo<Variante, $this> */
    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class, 'variante_id');
    }

    /** @return HasOneThrough<Producto, Variante, $this> */
    public function producto(): HasOneThrough
    {
        return $this->hasOneThrough(Producto::class, Variante::class, 'id', 'id', 'variante_id', 'producto_id');
    }
}
