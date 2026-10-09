<?php

declare(strict_types=1);

namespace App\Models;

/**
 * @property int $id
 * @property string $email
 * @property string $password_hash
 * @property bool $has_set_password
 */

use App\Models\Omnichannel\OmnichannelAgentConfig;
use App\Models\Omnichannel\OmnichannelContact;
use App\Models\Omnichannel\OmnichannelConversation;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use OwenIt\Auditing\Contracts\Auditable;
use Spatie\SchemalessAttributes\Casts\SchemalessAttributes;
use Spatie\SchemalessAttributes\SchemalessAttributesTrait;

/**
 * @property int $id
 * @property string $email
 * @property string $password_hash
 * @property bool $has_set_password
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
/** @property \Illuminate\Database\Eloquent\Collection<int, Rol> $roles */
class Usuario extends Authenticatable implements Auditable
{
    use HasFactory, Notifiable, \OwenIt\Auditing\Auditable, SchemalessAttributesTrait, SoftDeletes;

    protected $table = 'usuario';

    protected $auditExclude = ['password_hash', 'google_id', 'remember_token'];

    protected $fillable = [
        'nombres', 'apellidos', 'tipo_documento', 'dni', 'email', 'telefono', 'telefono_secundario',
        'password_hash', 'estado', 'google_id', 'fecha_nacimiento', 'has_set_password',
        'rfm_score', 'ltv', 'last_order_date', 'total_orders', 'segmento', 'empresa_id',
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
        'remember_token',
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

    /** @return BelongsToMany<Rol, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Rol::class, 'usuario_rol', 'usuario_id', 'rol_id');
    }

    /** @return HasMany<Pedido, $this> */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class, 'usuario_id');
    }

    /** @return HasMany<ClienteNota, $this> */
    public function notas(): HasMany
    {
        return $this->hasMany(ClienteNota::class, 'cliente_id');
    }

    /** @return HasMany<DireccionUsuario, $this> */
    public function direcciones(): HasMany
    {
        return $this->hasMany(DireccionUsuario::class, 'usuario_id');
    }

    /** @return HasOne<Carrito, $this> */
    public function carrito(): HasOne
    {
        return $this->hasOne(Carrito::class, 'usuario_id');
    }

    /** @return HasMany<UsuarioTarjeta, $this> */
    public function tarjetas(): HasMany
    {
        return $this->hasMany(UsuarioTarjeta::class, 'usuario_id');
    }

    /** @return HasMany<UsuarioDatosReembolso, $this> */
    public function datosReembolso(): HasMany
    {
        return $this->hasMany(UsuarioDatosReembolso::class, 'usuario_id');
    }

    /** @return HasMany<UsuarioLista, $this> */
    public function listas(): HasMany
    {
        return $this->hasMany(UsuarioLista::class, 'usuario_id');
    }

    /** @return HasMany<CrmCase, $this> */
    public function crmCases(): HasMany
    {
        return $this->hasMany(CrmCase::class, 'asignado_a');
    }

    /** @return HasMany<CrmDeal, $this> */
    public function crmDeals(): HasMany
    {
        return $this->hasMany(CrmDeal::class, 'usuario_id');
    }

    /** @return HasMany<OmnichannelContact, $this> */
    public function omnichannelContacts(): HasMany
    {
        return $this->hasMany(OmnichannelContact::class, 'usuario_id');
    }

    /** @return HasOne<OmnichannelAgentConfig, $this> */
    public function omnichannelConfig(): HasOne
    {
        return $this->hasOne(OmnichannelAgentConfig::class, 'usuario_id');
    }

    /** @return HasMany<OmnichannelConversation, $this> */
    public function omnichannelConversations(): HasMany
    {
        return $this->hasMany(OmnichannelConversation::class, 'assigned_user_id');
    }

    /** @return BelongsTo<CrmCompany, $this> */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(CrmCompany::class, 'empresa_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return $this->nombres.' '.$this->apellidos;
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

        if (! $this->relationLoaded('roles')) {
            $this->load('roles.permisos');
        }

        foreach ($this->roles as $rol) {
            foreach ($rol->permisos as $p) {
                if ($p->nombre === $permiso) {
                    return true;
                }
            }
        }

        return false;
    }
}
