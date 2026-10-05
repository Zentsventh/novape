<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmEvidenceLedger extends Model
{
    use HasFactory;

    protected $fillable = [
        'model_type',
        'model_id',
        'field_name',
        'suggested_value',
        'confidence_score',
        'source',
        'status',
    ];
}
