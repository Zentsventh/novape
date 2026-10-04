<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use OwenIt\Auditing\Contracts\Auditable;

class Pedido extends Model implements Auditable
{
    use HasFactory, \OwenIt\Auditing\Auditable;
    
    protected $table = 'pedido';

    protected $fillable = [
        'usuario_id', 'codigo', 'subtotal', 'descuento', 'costo_envio', 
        'total', 'estado', 'tracking_number', 'courier_name', 'tipo_comprobante', 
        'documento_cliente', 'nombre_facturacion', 'direccion_facturacion', 
        'direccion_envio_snapshot', 'cupon_id', 'puntos_usados'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'costo_envio' => 'decimal:2',
        'total' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'direccion_envio_snapshot' => 'array',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class, 'pedido_id');
    }

    public function envio(): HasOne
    {
        return $this->hasOne(Envio::class, 'pedido_id');
    }

    public function pago(): HasOne
    {
        return $this->hasOne(Pago::class, 'pedido_id');
    }

    public function comprobante(): HasOne
    {
        return $this->hasOne(Comprobante::class, 'pedido_id');
    }

    public function cupon(): BelongsTo
    {
        return $this->belongsTo(Cupon::class, 'cupon_id');
    }

    /**
     * Scope for querying completed orders.
     */
    public function scopeCompletados(Builder $query): Builder
    {
        return $query->where('estado', 'completado');
    }

    /**
     * Scope for querying pending orders.
     */
    public function scopePendientes(Builder $query): Builder
    {
        return $query->where('estado', 'Pendiente');
    }
}
