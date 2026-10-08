<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use OwenIt\Auditing\Contracts\Auditable;

class Pedido extends Model implements Auditable
{
    use HasFactory, \OwenIt\Auditing\Auditable;

    protected $table = 'pedido';

    protected $fillable = [
        'usuario_id', 'codigo', 'subtotal', 'descuento', 'costo_envio', 'checkout_session_id', 'currency',
        'fulfilled_at', 'dispatched_at', 'fulfillment_reference', 'commerce_policy_snapshot', 'checkout_fingerprint', 'redeemed_points_restored',
        'total', 'estado', 'tracking_number', 'courier_name', 'tipo_comprobante',
        'documento_cliente', 'nombre_facturacion', 'direccion_facturacion',
        'direccion_envio_snapshot', 'cupon_id', 'puntos_usados', 'crm_deal_id', 'stock_consumed_at', 'stock_returned_at', 'igv_porcentaje', 'invoice_snapshot',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'descuento' => 'decimal:2',
        'costo_envio' => 'decimal:2',
        'total' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'direccion_envio_snapshot' => 'array',
        'invoice_snapshot' => 'array',
        'commerce_policy_snapshot' => 'array',
        'fulfilled_at' => 'datetime',
        'dispatched_at' => 'datetime',
        'stock_consumed_at' => 'datetime',
        'stock_returned_at' => 'datetime',
    ];

    /** @return BelongsTo<Usuario, $this> */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /** @return HasMany<PedidoItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PedidoItem::class, 'pedido_id');
    }

    /** @return HasOne<Envio, $this> */
    public function envio(): HasOne
    {
        return $this->hasOne(Envio::class, 'pedido_id');
    }

    /** @return HasOne<Pago, $this> */
    public function pago(): HasOne
    {
        return $this->hasOne(Pago::class, 'pedido_id');
    }

    /** @return HasOne<Comprobante, $this> */
    public function comprobante(): HasOne
    {
        return $this->hasOne(Comprobante::class, 'pedido_id');
    }

    /** @return BelongsTo<Cupon, $this> */
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
