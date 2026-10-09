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
use Illuminate\Support\Carbon;
use OwenIt\Auditing\Contracts\Auditable;
use Spatie\SchemalessAttributes\Casts\SchemalessAttributes;

/** @property Carbon|null $fecha_cierre_real */
class CrmDeal extends Model implements Auditable
{
    use HasFactory, HasPolymorphicCleanup, \OwenIt\Auditing\Auditable, \Illuminate\Database\Eloquent\SoftDeletes;

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
        'fecha_cierre_real' => 'datetime',
        'valor' => 'decimal:2',
        'custom_fields' => SchemalessAttributes::class,
    ];

    public function scopeWithCustomAttributes(Builder $query): Builder
    {
        return $this->custom_fields->modelScope();
    }

    /** @return BelongsTo<Usuario, $this> */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /** @return BelongsTo<CrmCompany, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(CrmCompany::class, 'empresa_id');
    }

    /** @return BelongsTo<CrmStage, $this> */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(CrmStage::class, 'stage_id');
    }

    /** @return MorphMany<CrmNote, $this> */
    public function notes(): MorphMany
    {
        return $this->morphMany(CrmNote::class, 'notable');
    }

    /** @return MorphMany<CrmTimelineEvent, $this> */
    public function timelineEvents(): MorphMany
    {
        return $this->morphMany(CrmTimelineEvent::class, 'trackable');
    }

    /** @return HasMany<CrmActivity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(CrmActivity::class, 'deal_id')->orderBy('created_at', 'desc');
    }

    /** @return HasMany<CrmDealProduct, $this> */
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
