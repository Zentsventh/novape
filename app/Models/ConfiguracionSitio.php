<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfiguracionSitio extends Model
{
    protected $table = 'configuracion_sitio';
    public $timestamps = false;

    protected $fillable = ['clave', 'valor', 'descripcion'];

    /**
     * Get a config value by key
     */
    public static function obtener($clave, $default = null)
    {
        return \Illuminate\Support\Facades\Cache::rememberForever("config_{$clave}", function() use ($clave, $default) {
            $config = static::where('clave', $clave)->first();
            return $config ? $config->valor : $default;
        });
    }

    /**
     * Set a config value by key
     */
    public static function establecer($clave, $valor)
    {
        \Illuminate\Support\Facades\Cache::forget("config_{$clave}");
        return static::updateOrCreate(
            ['clave' => $clave],
            ['valor' => $valor]
        );
    }
}
