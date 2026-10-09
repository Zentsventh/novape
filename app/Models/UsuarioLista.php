<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UsuarioLista extends Model
{
    use HasFactory;

    protected $table = 'usuario_listas';

    protected $fillable = [
        'usuario_id',
        'nombre',
        'es_publica',
    ];

    public function usuario(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UsuarioListaItem::class, 'lista_id');
    }
}
