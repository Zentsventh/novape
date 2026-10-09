<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Almacen extends Model
{
    use HasFactory;

    protected $table = 'almacenes';

    protected $fillable = [
        'nombre',
        'direccion',
        'activo'
    ];

    public function stocks()
    {
        return $this->hasMany(StockAlmacen::class, 'almacen_id');
    }

    public function movimientos()
    {
        return $this->hasMany(InventarioMovimiento::class, 'almacen_id');
    }
}
