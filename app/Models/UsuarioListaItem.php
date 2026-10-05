<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UsuarioListaItem extends Model
{
    use HasFactory;

    protected $table = 'usuario_lista_items';

    protected $fillable = [
        'lista_id',
        'producto_id',
    ];

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<UsuarioLista, $this> */
    public function lista(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(UsuarioLista::class, 'lista_id');
    }

    public function producto(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
