<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Resena extends Model
{
    protected $table = 'resenas';
    protected $fillable = ['producto_id', 'usuario_id', 'calificacion', 'comentario', 'aprobado'];
    protected $casts = ['aprobado' => 'boolean', 'calificacion' => 'integer'];

    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Producto, $this> */
    public function producto(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(Producto::class, 'producto_id'); }
    /** @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Usuario, $this> */
    public function usuario(): \Illuminate\Database\Eloquent\Relations\BelongsTo { return $this->belongsTo(Usuario::class, 'usuario_id'); }
}
