<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComprobanteSerie extends Model
{
    use HasFactory;

    protected $table = 'comprobantes_series';

    protected $fillable = [
        'tipo_comprobante',
        'serie',
        'correlativo_actual',
        'activo'
    ];
}
