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

    /** @return BelongsTo<CrmDeal, $this> */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(CrmDeal::class, 'deal_id');
    }

    /** @return BelongsTo<Usuario, $this> */
    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /** @return BelongsTo<CrmCompany, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(CrmCompany::class, 'empresa_id');
    }
}
