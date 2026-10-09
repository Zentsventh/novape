<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlmacenStock extends Model
{
    use HasFactory;

    protected $table = 'almacen_stocks';

    protected $fillable = [
        'variante_id',
        'almacen_id',
        'stock_fisico',
        'stock_reservado',
        'pasillo',
        'estante',
        'nivel',
    ];

    protected $casts = [
        'stock_fisico' => 'integer',
        'stock_reservado' => 'integer',
    ];

    public function variante(): BelongsTo
    {
        return $this->belongsTo(Variante::class, 'variante_id');
    }

    public function almacen(): BelongsTo
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }
    
    public function getStockDisponibleAttribute(): int
    {
        return $this->stock_fisico - $this->stock_reservado;
    }
}
