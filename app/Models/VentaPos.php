<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VentaPos extends Model
{
    use HasFactory;

    protected $table = 'ventas_pos';

    protected $fillable = [
        'cajero_id',
        'cliente_id',
        'codigo_ticket',
        'total',
        'metodo_pago',
    ];
}
