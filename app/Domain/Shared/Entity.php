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
