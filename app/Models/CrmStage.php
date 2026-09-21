<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmStage extends Model
{
    use HasFactory;

    protected $table = 'crm_stages';

    protected $fillable = [
        'pipeline_id',
        'nombre',
        'orden',
        'color'
    ];

    public function pipeline()
    {
        return $this->belongsTo(CrmPipeline::class, 'pipeline_id');
    }

    public function deals()
    {
        return $this->hasMany(CrmDeal::class, 'stage_id');
    }
}
