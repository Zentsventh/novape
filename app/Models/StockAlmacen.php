<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockAlmacen extends Model
{
    use HasFactory;

    protected $table = 'stock_almacen';

    protected $fillable = [
        'almacen_id',
        'variante_id',
        'cantidad',
    ];

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'almacen_id');
    }

    public function variante()
    {
        return $this->belongsTo(Variante::class, 'variante_id');
    }
}
