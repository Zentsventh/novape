<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RmaRequest extends Model
{
    protected $fillable = [
        'usuario_id',
        'pedido_id',
        'producto_id',
        'type',
        'status',
        'reason',
        'description',
        'images',
        'admin_notes',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
