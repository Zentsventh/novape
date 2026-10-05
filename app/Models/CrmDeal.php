<?php

declare(strict_types=1);

namespace App\Models;

use App\Traits\HasPolymorphicCleanup;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use OwenIt\Auditing\Contracts\Auditable;
use Spatie\SchemalessAttributes\Casts\SchemalessAttributes;

class CrmDeal extends Model implements Auditable
{
    use HasFactory, HasPolymorphicCleanup, \OwenIt\Auditing\Auditable;

    protected $table = 'crm_deals';

    protected $fillable = [
        'usuario_id',
        'empresa_id',
        'stage_id',
        'titulo',
        'valor',
        'estado', // 'open', 'won', 'lost'
        'fecha_cierre_esperada',
        'omnichannel_conversation_id',
    ];

    protected $casts = [
        'fecha_cierre_esperada' => 'datetime',
        'valor' => 'decimal:2',
        'custom_fields' => SchemalessAttributes::class,
    ];

    public function scopeWithCustomAttributes(Builder $query): Builder
    {
        return $this->custom_fields->modelScope();
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(CrmCompany::class, 'empresa_id');
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(CrmStage::class, 'stage_id');
    }

    public function notes(): MorphMany
    {
        return $this->morphMany(CrmNote::class, 'notable');
    }

    public function timelineEvents(): MorphMany
    {
        return $this->morphMany(CrmTimelineEvent::class, 'trackable');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CrmActivity::class, 'deal_id')->orderBy('created_at', 'desc');
    }

    public function products(): HasMany
    {
        return $this->hasMany(CrmDealProduct::class);
    }

    protected $appends = ['ai_score'];

    public function getAiScoreAttribute()
    {
        if ($this->estado === 'won') {
            return 100;
        }
        if ($this->estado === 'lost') {
            return 0;
        }

        $score = 50; // Base score

        if ($this->cliente) {
            $pedidosCount = $this->cliente->total_orders ?? $this->cliente->pedidos()->count();
            if ($pedidosCount > 0) {
                $score += 15;
            }
            if ($pedidosCount >= 5) {
                $score += 10;
            }
        }

        if ($this->valor > 500) {
            $score += 10;
        }

        // Penalty if open for more than 15 days
        if ($this->created_at && $this->created_at->diffInDays(now()) > 15) {
            $score -= 15;
        }

        // Bonus if there is recent activity
        $actividadesCount = $this->activities()->count();
        if ($actividadesCount > 0) {
            $score += min($actividadesCount * 5, 20); // max +20 for engagement
        }

        return max(1, min(99, $score)); // Cap between 1 and 99 for open deals
    }
}
