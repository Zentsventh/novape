<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmAutomation extends Model
{
    protected $table = 'crm_automations';

    protected $fillable = [
        'nombre',
        'activo',
        'trigger_type',
        'condiciones',
        'acciones'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'condiciones' => 'array',
        'acciones' => 'array',
    ];
}
