<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class InventarioMovimiento extends Model
{
    use HasFactory;

    protected $table = 'inventario_movimientos';

    protected $fillable = [
        'variante_id',
        'almacen_id',
        'usuario_id',
        'tipo',
        'cantidad',
        'stock_anterior',
        'stock_nuevo',
        'costo_unitario',
        'motivo',
        'referencia_tipo',
        'referencia_id',
        'operation_key',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'stock_anterior' => 'integer',
        'stock_nuevo' => 'integer',
        'costo_unitario' => 'decimal:4',
    ];

    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class, 'variante_id');
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Get the parent reference model (e.g. Pedido, VentaPos, Comprobante).
     */
    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }
}
