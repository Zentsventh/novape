<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reclamo extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'codigo',
        'nombres',
        'apellidos',
        'tipo_documento',
        'numero_documento',
        'telefono',
        'email',
        'direccion',
        'menor_edad',
        'nombre_apoderado',
        'bien_contratado',
        'monto_reclamado',
        'pedido_relacionado',
        'tipo_reclamo',
        'detalle',
        'pedido_consumidor',
        'estado',
        'respuesta_admin'
    ];
}
