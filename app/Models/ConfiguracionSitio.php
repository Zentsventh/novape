<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ConfiguracionSitio extends Model
{
    public const SECRET_KEYS = ['whatsapp_token', 'whatsapp_verify_token', 'whatsapp_app_secret'];

    protected $table = 'configuracion_sitio';

    public $timestamps = false;

    protected $fillable = ['clave', 'valor', 'descripcion'];

    /**
     * In-memory cache of all config values (loaded once per request).
     */

    /**
     * Load ALL config values in a single query and cache them.
     * Reduces N queries (one per key) to 1 query total.
     */
    private static function loadAll(): array
    {
        $request = request();
        $level = DB::transactionLevel();
        $memo = $request->attributes->get('site_settings_snapshot');
        if ($memo !== null && $memo['level'] === $level) return $memo['values'];
        $load = function () {
            return static::pluck('valor', 'clave')->toArray();
        };

        $values = DB::transactionLevel() > 0
            ? $load() : Cache::remember('config_all_values', 60, $load);
        $request->attributes->set('site_settings_snapshot',['level'=>$level,'values'=>$values]);
        return $values;
    }

    /**
     * Get a config value by key — uses batch-loaded cache (1 query for ALL keys).
     */
    public static function obtener($clave, $default = null)
    {
        $all = self::loadAll();

        $value = $all[$clave] ?? $default;

        return is_string($value) && str_starts_with($value, 'encrypted:v1:')
            ? decrypt(substr($value, 13), false) : $value;
    }

    /**
     * Set a config value by key
     */
    public static function establecer($clave, $valor)
    {
        if (in_array($clave, self::SECRET_KEYS, true) && $valor !== null && $valor !== '') {
            $valor = 'encrypted:v1:'.encrypt((string) $valor, false);
        }
        $record = static::updateOrCreate(
            ['clave' => $clave],
            ['valor' => $valor]
        );
        request()->attributes->remove('site_settings_snapshot');
        DB::afterCommit(fn () => self::clearMemo());

        return $record;
    }

    /**
     * Clear the in-memory memo (useful for testing).
     */
    public static function clearMemo(): void
    {
        request()->attributes->remove('site_settings_snapshot');
        Cache::forget('config_all_values');
        Cache::forget('globalConfig');
    }
}
