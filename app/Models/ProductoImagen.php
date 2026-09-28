<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoImagen extends Model
{
    protected $table = 'producto_imagen';
    public $timestamps = false;

    protected $fillable = ['producto_id', 'url', 'orden'];

    public function producto(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function getUrlAttribute($value)
    {
        if (empty($value)) return $value;
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) return $value;
        if (str_starts_with($value, '/storage/')) {
            $disk = config('filesystems.default', 'public');
            if ($disk === 'azure') {
                $relative = ltrim(substr($value, 8), '/');
                try {
                    return \Illuminate\Support\Facades\Storage::disk('azure')->url($relative);
                } catch (\Throwable $e) {
                    return $value;
                }
            }
            return $value;
        }

        try {
            return \Illuminate\Support\Facades\Storage::disk(config('filesystems.default', 'public'))->url($value);
        } catch (\Throwable $e) {
            return '/storage/' . ltrim($value, '/');
        }
    }
}
