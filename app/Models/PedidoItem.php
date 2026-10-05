<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class PedidoItem extends Model
{
    protected $table = 'pedido_item';

    protected $fillable = [
        'pedido_id',
        'variante_id',
        'cantidad',
        'precio_unitario', 'costo_unitario', 'almacen_id', 'producto_nombre', 'sku',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** @return BelongsTo<Pedido, $this> */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
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
