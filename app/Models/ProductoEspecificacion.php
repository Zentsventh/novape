<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductoEspecificacion extends Model
{
    use HasFactory;

    protected $table = 'producto_especificaciones';

    protected $fillable = [
        'producto_id',
        'clave',
        'valor',
    ];

    public function producto(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
