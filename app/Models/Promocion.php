<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promocion extends Model
{
    protected $table = 'promociones';

    protected $fillable = [
        'nombre',
        'tipo_descuento',
        'valor_descuento',
        'fecha_inicio',
        'fecha_fin',
        'activa', 'combinable_coupon'
    ];

    protected $casts = [
        'activa' => 'boolean',
        'combinable_coupon' => 'boolean',
        'valor_descuento' => 'decimal:2',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<Producto, $this> */
    public function productos(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Producto::class, 'producto_promocion', 'promocion_id', 'producto_id');
    }
}
