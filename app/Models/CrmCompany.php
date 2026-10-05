<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\SchemalessAttributes\Casts\SchemalessAttributes;

class CrmCompany extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'crm_companies';

    protected $fillable = [
        'nombre',
        'ruc',
        'dominio',
        'industria',
        'tamaño',
        'sitio_web',
        'linkedin_url',
        'telefono',
        'email',
        'direccion',
        'ciudad',
        'pais',
        'logo_url',
        'usuario_responsable_id',
        'ingresos_anuales',
        'empleados',
        'descripcion',
    ];

    protected $casts = [
        'ingresos_anuales' => 'decimal:2',
        'empleados' => 'integer',
        'custom_fields' => SchemalessAttributes::class,
    ];

    // ── Relationships ──

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_responsable_id');
    }

    public function personas(): HasMany
    {
        return $this->hasMany(Usuario::class, 'empresa_id');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(CrmDeal::class, 'empresa_id');
    }

    public function notes(): MorphMany
    {
        return $this->morphMany(CrmNote::class, 'notable');
    }

    public function timelineEvents(): MorphMany
    {
        return $this->morphMany(CrmTimelineEvent::class, 'trackable');
    }

    // ── Scopes ──

    public function scopeSearch($query, ?string $search)
    {
        if (! $search) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('nombre', 'like', "%{$search}%")
                ->orWhere('dominio', 'like', "%{$search}%")
                ->orWhere('industria', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        });
    }

    // ── Accessors ──

    protected $appends = ['deals_count_cached', 'personas_count_cached'];

    public function getDealsCountCachedAttribute(): int
    {
        return $this->deals_count ?? $this->deals()->count();
    }

    public function getPersonasCountCachedAttribute(): int
    {
        return $this->personas_count ?? $this->personas()->count();
    }
}
