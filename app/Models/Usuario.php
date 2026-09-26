<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Collection;
use Spatie\SchemalessAttributes\Casts\SchemalessAttributes;
use Spatie\SchemalessAttributes\SchemalessAttributesTrait;
use App\Models\CrmCompany;
use App\Models\Crm\CrmCase;
use OwenIt\Auditing\Contracts\Auditable;

class Usuario extends Authenticatable implements Auditable
{
    use HasFactory, Notifiable, SoftDeletes, SchemalessAttributesTrait, \OwenIt\Auditing\Auditable;

    protected $table = 'usuario';

    protected $fillable = [
        'nombres', 'apellidos', 'tipo_documento', 'dni', 'email', 'telefono', 'telefono_secundario',
        'password_hash', 'estado', 'google_id', 'fecha_nacimiento', 'has_set_password',
        'rfm_score', 'ltv', 'last_order_date', 'total_orders', 'segmento', 'empresa_id'
    ];

    protected $casts = [
        'has_set_password' => 'boolean',
        'fecha_nacimiento' => 'date',
        'last_order_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'custom_fields' => SchemalessAttributes::class,
    ];

    protected $hidden = [
        'password_hash',
        'google_id',
    ];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'usuario_rol', 'usuario_id', 'rol_id');
    }

    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'usuario_id');
    }

    public function notas(): HasMany
    {
        return $this->hasMany(ClienteNota::class, 'cliente_id');
    }

    public function direcciones(): HasMany
    {
        return $this->hasMany(DireccionUsuario::class, 'usuario_id');
    }

    public function carrito(): HasOne
    {
        return $this->hasOne(Carrito::class, 'usuario_id');
    }

    public function tarjetas(): HasMany
    {
        return $this->hasMany(UsuarioTarjeta::class, 'usuario_id');
    }

    public function datosReembolso(): HasMany
    {
        return $this->hasMany(UsuarioDatosReembolso::class, 'usuario_id');
    }

    public function listas(): HasMany
    {
        return $this->hasMany(UsuarioLista::class, 'usuario_id');
    }



    public function crmCases(): HasMany
    {
        return $this->hasMany(CrmCase::class, 'asignado_a');
    }

    public function crmDeals(): HasMany
    {
        return $this->hasMany(CrmDeal::class, 'usuario_id');
    }

    public function omnichannelContacts(): HasMany
    {
        return $this->hasMany(\App\Models\Omnichannel\OmnichannelContact::class, 'usuario_id');
    }

    public function omnichannelConfig(): HasOne
    {
        return $this->hasOne(\App\Models\Omnichannel\OmnichannelAgentConfig::class, 'usuario_id');
    }

    public function omnichannelConversations(): HasMany
    {
        return $this->hasMany(\App\Models\Omnichannel\OmnichannelConversation::class, 'assigned_user_id');
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(CrmCompany::class, 'empresa_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return $this->nombres . ' ' . $this->apellidos;
    }

    public function esAdmin(): bool
    {
        return $this->roles()->where('nombre', 'admin')->exists();
    }

    public function esCliente(): bool
    {
        return $this->roles()->where('nombre', 'cliente')->exists();
    }

    public function tieneRol(string $nombreRol): bool
    {
        return $this->roles()->where('nombre', $nombreRol)->exists();
    }

    public function getAllPermisos(): Collection
    {
        return $this->roles()->with('permisos')->get()
            ->pluck('permisos')
            ->flatten()
            ->pluck('nombre')
            ->unique()
            ->values();
    }

    public function tienePermiso(string $permiso): bool
    {
        if ($this->esAdmin()) {
            return true;
        }

        return $this->roles()->whereHas('permisos', function ($q) use ($permiso) {
            $q->where('nombre', $permiso);
        })->exists();
    }
}
