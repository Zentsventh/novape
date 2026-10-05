<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ConfiguracionSitio extends Model
{
    protected $table = 'configuracion_sitio';

    public $timestamps = false;

    protected $fillable = ['clave', 'valor', 'descripcion'];

    /**
     * In-memory cache of all config values (loaded once per request).
     */
    private static ?array $allConfigsMemo = null;

    /**
     * Load ALL config values in a single query and cache them.
     * Reduces N queries (one per key) to 1 query total.
     */
    private static function loadAll(): array
    {
        if (self::$allConfigsMemo !== null) {
            return self::$allConfigsMemo;
        }

        self::$allConfigsMemo = Cache::rememberForever('config_all_values', function () {
            return static::pluck('valor', 'clave')->toArray();
        });

        return self::$allConfigsMemo;
    }

    /**
     * Get a config value by key — uses batch-loaded cache (1 query for ALL keys).
     */
    public static function obtener($clave, $default = null)
    {
        $all = self::loadAll();

        return $all[$clave] ?? $default;
    }

    /**
     * Set a config value by key
     */
    public static function establecer($clave, $valor)
    {
        // Invalidate both the old individual cache and the batch cache
        Cache::forget("config_{$clave}");
        Cache::forget('config_all_values');
        self::$allConfigsMemo = null;
        Cache::forget('globalConfig');

        return static::updateOrCreate(
            ['clave' => $clave],
            ['valor' => $valor]
        );
    }

    /**
     * Clear the in-memory memo (useful for testing).
     */
    public static function clearMemo(): void
    {
        self::$allConfigsMemo = null;
    }
}
