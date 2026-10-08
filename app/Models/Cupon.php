<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cupon extends Model
{
    protected $table = 'cupones';

    protected $fillable = [
        'codigo',
        'tipo',
        'valor',
        'monto_minimo',
        'fecha_inicio',
        'fecha_fin',
        'limite_usos',
        'usos_actuales',
        'activo',
        'unico_por_cliente', 'combinable_points'
    ];

    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'activo' => 'boolean',
        'combinable_points' => 'boolean',
    ];
}
