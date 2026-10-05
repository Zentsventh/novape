<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CrmPipeline extends Model
{
    use HasFactory;

    protected $table = 'crm_pipelines';

    protected $fillable = [
        'nombre',
        'descripcion',
        'is_default',
    ];

    public function stages(): HasMany
    {
        return $this->hasMany(CrmStage::class, 'pipeline_id')->orderBy('orden');
    }
}
