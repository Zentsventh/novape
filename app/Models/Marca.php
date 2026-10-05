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

    public function productos(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Producto::class, 'marca_id');
    }
}
