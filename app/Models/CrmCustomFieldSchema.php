<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmCustomFieldSchema extends Model
{
    protected $table = 'crm_custom_fields_schema';

    protected $fillable = [
        'model_type',
        'name',
        'label',
        'type',
        'options',
        'required',
    ];

    protected $casts = [
        'options' => 'array',
        'required' => 'boolean',
    ];
}
