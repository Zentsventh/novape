<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class ActividadLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'accion',
        'modelo',
        'modelo_id',
        'detalles'
    ];

    protected $casts = [
        'detalles' => 'array',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'user_id');
    }

    public static function log($accion, $modelo = null, $modelo_id = null, $detalles = null)
    {
        return self::create([
            'user_id' => Auth::id(),
            'accion' => $accion,
            'modelo' => $modelo,
            'modelo_id' => $modelo_id,
            'detalles' => $detalles
        ]);
    }
}
