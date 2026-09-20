<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CrmActivity extends Model
{
    protected $table = 'crm_activities';

    protected $fillable = [
        'deal_id',
        'usuario_id',
        'tipo',
        'contenido',
        'fecha_vencimiento',
        'completada'
    ];

    protected $casts = [
        'fecha_vencimiento' => 'datetime',
        'completada' => 'boolean'
    ];

    public function deal()
    {
        return $this->belongsTo(CrmDeal::class, 'deal_id');
    }

    public function autor()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
