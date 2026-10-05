<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmStage extends Model
{
    use HasFactory;

    protected $table = 'crm_stages';

    protected $fillable = [
        'pipeline_id',
        'nombre',
        'orden',
        'color',
    ];

    /** @return BelongsTo<CrmPipeline, $this> */
    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(CrmPipeline::class, 'pipeline_id');
    }

    /** @return HasMany<CrmDeal, $this> */
    public function deals(): HasMany
    {
        return $this->hasMany(CrmDeal::class, 'stage_id');
    }
}
