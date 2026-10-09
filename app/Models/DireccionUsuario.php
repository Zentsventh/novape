<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DireccionUsuario extends Model
{
    protected $table = 'direccion_usuario';
    protected $casts = ['principal' => 'boolean'];

    protected $fillable = [
        'usuario_id',
        'direccion',
        'referencia',
        'departamento',
        'provincia',
        'distrito',
        'codigo_postal',
        'principal'
    ];

    public function usuario(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
