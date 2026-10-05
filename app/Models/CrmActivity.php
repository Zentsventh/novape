<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmActivity extends Model
{
    protected $table = 'crm_activities';

    protected $fillable = [
        'deal_id',
        'empresa_id',
        'usuario_id',
        'tipo',
        'contenido',
        'fecha_vencimiento',
        'completada',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'datetime',
        'completada' => 'boolean',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(CrmDeal::class, 'deal_id');
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(CrmCompany::class, 'empresa_id');
    }
}
