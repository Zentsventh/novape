<?php
namespace App\Domain\Shared;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Base Entity class for all domain entities.
 * Uses UUID as primary key to avoid exposing auto‑increment IDs.
 */
abstract class Entity extends Model
{
    use HasUuids;

    protected static function booted(): void
    {
        // This abandoned UUID schema is kept readable for historical compatibility.
        // Operational writes use App\Models and the Spanish canonical schema.
        static::saving(fn () => throw new \LogicException('Modelo legado de solo lectura; utiliza el modelo canónico de App\\Models.'));
        static::deleting(fn () => throw new \LogicException('El esquema legado se conserva; no se elimina desde la aplicación.'));
    }

    /**
     * Disable auto‑incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The primary key type.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;
}
?>
