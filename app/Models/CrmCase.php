<?php

namespace App\Models;

use App\Models\Omnichannel\OmnichannelConversation;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CrmCase extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'crm_cases';

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'estado',
        'prioridad',
        'fecha_vencimiento',
        'cliente_id',
        'pedido_id',
        'asignado_a',
        'deal_id',
        'omnichannel_conversation_id',
    ];

    protected $casts = [
        'fecha_vencimiento' => 'datetime',
    ];

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cliente_id');
    }

    public function asignadoA(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'asignado_a');
    }

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class, 'pedido_id');
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(CrmDeal::class, 'deal_id');
    }

    public function omnichannelConversation(): BelongsTo
    {
        return $this->belongsTo(OmnichannelConversation::class, 'omnichannel_conversation_id');
    }

    public function notas(): MorphMany
    {
        return $this->morphMany(CrmNote::class, 'notable')->latest();
    }

    public function actividades(): MorphMany
    {
        return $this->morphMany(CrmTimelineEvent::class, 'trackable')->latest();
    }
}
