<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use SoftDeletes;
    protected $table = 'marca';
    public $timestamps = false;

    protected $fillable = ['nombre'];
    protected static function booted(): void
    {
        static::saved(fn () => \Illuminate\Support\Facades\Cache::forget('home_categorias_menu_v3'));
        static::deleted(fn () => \Illuminate\Support\Facades\Cache::forget('home_categorias_menu_v3'));
    }

    public function productos(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Producto::class, 'marca_id');
    }
}
