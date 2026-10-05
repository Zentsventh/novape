<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CajaSesion extends Model
{
    protected $table = 'cajas_sesiones';

    protected $fillable = ['cajero_id', 'monto_inicial', 'monto_final_esperado', 'monto_final_declarado', 'descuadre', 'fecha_apertura', 'fecha_cierre', 'estado'];

    protected $casts = ['fecha_apertura' => 'datetime', 'fecha_cierre' => 'datetime', 'monto_inicial' => 'decimal:2', 'monto_final_esperado' => 'decimal:2', 'monto_final_declarado' => 'decimal:2', 'descuadre' => 'decimal:2'];

    /** @return BelongsTo<Usuario, $this> */
    public function cajero(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cajero_id');
    }

    /** @return HasMany<CajaMovimiento, $this> */
    public function movimientos(): HasMany
    {
        return $this->hasMany(CajaMovimiento::class, 'caja_sesion_id');
    }
}
