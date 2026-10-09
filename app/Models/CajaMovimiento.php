<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CajaMovimiento extends Model
{
    use HasFactory;

    protected $table = 'caja_movimientos';

    protected $fillable = [
        'caja_sesion_id',
        'usuario_id',
        'tipo',
        'monto',
        'concepto'
    ];

    public function cajaSesion(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'caja_sesion_id');
    }

    public function usuario(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
