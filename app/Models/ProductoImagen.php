<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoImagen extends Model
{
    protected static function booted(): void
    {
        static::saved(fn () => \Illuminate\Support\Facades\Cache::forget('store_image_paths_v1'));
        static::deleted(fn () => \Illuminate\Support\Facades\Cache::forget('store_image_paths_v1'));
    }
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
        if (str_starts_with($value, '/') && ! str_starts_with($value, '/storage/')) return $value;
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
            // Retain compatibility while legacy JPG/PNG references are converted.
            // Never rewrite an existing image or an external provider URL.
            $relative = ltrim(substr($value, 8), '/');
            $public = \Illuminate\Support\Facades\Storage::disk('public');
            if (!$public->exists($relative)) {
                $converted = str_ends_with(strtolower($relative), '_resultado.webp') ? $relative
                    : preg_replace('/\.(jpe?g|png|webp)$/i', '_resultado.webp', $relative);
                if ($public->exists($converted)) return '/storage/'.$converted;
                // Shared photos may be moved once while several products still
                // reference the previous folder. Resolve an existing association.
                $filename = basename($converted);
                // Build one exact filename index, instead of scanning the table for every image.
                // File existence is always checked: cached references never replace missing assets.
                $paths = request()->attributes->get('store_image_paths');
                if ($paths === null) {
                    $paths = \Illuminate\Support\Facades\Cache::remember('store_image_paths_v1', 60, function () {
                        $index = [];
                        foreach (\Illuminate\Support\Facades\DB::table('producto_imagen')->select('url')->cursor() as $row) {
                            if (str_starts_with($row->url ?? '', '/storage/')) {
                                $index[basename($row->url)][] = $row->url;
                            }
                        }
                        return $index;
                    });
                    request()->attributes->set('store_image_paths', $paths);
                }
                $candidates = $paths[$filename] ?? [];
                foreach ($candidates as $candidate) {
                    if (str_starts_with($candidate, '/storage/') && basename($candidate) === $filename
                        && $public->exists(ltrim(substr($candidate, 8), '/'))) return $candidate;
                }
                return '/images/product-unavailable.svg';
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
