<?php

declare(strict_types=1);

namespace App\Services\Admin\Settings;

use App\Models\ActividadLog;
use App\Models\ConfiguracionSitio;
use App\Models\Permiso;
use App\Models\Rol;
use App\Services\Admin\Roles\RolePermissionService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SystemConfigurationService
{
    public function getSettings(): \Illuminate\Support\Collection
    {
        return ConfiguracionSitio::all()->mapWithKeys(fn ($row) => [$row->clave => in_array($row->clave, ConfiguracionSitio::SECRET_KEYS, true) ? '' : $row->valor]);
    }

    public function updateSettings(array $data): void
    {
        DB::transaction(function () use ($data) {
            if (! empty($data['logo_url'])) {
                ConfiguracionSitio::establecer('logo_url', $data['logo_url']);
            }
            ConfiguracionSitio::establecer('nombre_sitio', $data['nombre_sitio']);
            ConfiguracionSitio::establecer('pago_tarjeta', isset($data['pago_tarjeta']) && $data['pago_tarjeta'] ? '1' : '0');
            ConfiguracionSitio::establecer('pago_transferencia', isset($data['pago_transferencia']) && $data['pago_transferencia'] ? '1' : '0');
            ConfiguracionSitio::establecer('envio_gratis', isset($data['envio_gratis']) && $data['envio_gratis'] ? '1' : '0');
            ConfiguracionSitio::establecer('igv_porcentaje', (string) $data['igv_porcentaje']);

            // WhatsApp
            if (! empty($data['whatsapp_token'])) {
                ConfiguracionSitio::establecer('whatsapp_token', $data['whatsapp_token']);
            }
            if (isset($data['whatsapp_phone_number_id'])) {
                ConfiguracionSitio::establecer('whatsapp_phone_number_id', $data['whatsapp_phone_number_id']);
            }
            if (! empty($data['whatsapp_verify_token'])) {
                ConfiguracionSitio::establecer('whatsapp_verify_token', $data['whatsapp_verify_token']);
            }
            if (! empty($data['whatsapp_app_secret'])) {
                ConfiguracionSitio::establecer('whatsapp_app_secret', $data['whatsapp_app_secret']);
            }
        });
    }

    public function getRoles(): Collection
    {
        return Rol::with('permisos')->get();
    }

    public function getPermissions(): Collection
    {
        return Permiso::all();
    }

    public function syncRolePermissions(array $data): void
    {
        abort_unless(auth('admin')->user()?->esAdmin(), 403);
        $rol = Rol::findOrFail($data['rol_id']);

        if ($rol->nombre === 'admin') {
            $permisosRequeridos = Permiso::pluck('id')->toArray();
            $rol->permisos()->sync($permisosRequeridos);
        } else {
            $rol->permisos()->sync($data['permisos'] ?? []);
        }

        ActividadLog::log('Actualizó permisos de un rol', 'rol', $rol->id, ['rol' => $rol->nombre, 'permisos' => $data['permisos'] ?? []]);
    }

    public function createRole(array $data): void
    {
        abort_unless(auth('admin')->user()?->esAdmin(), 403);
        $rol = Rol::create([
            'nombre' => strtolower($data['nombre']),
            'descripcion' => $data['descripcion'] ?? null,
        ]);

        ActividadLog::log('Creó un nuevo rol', 'rol', $rol->id, $rol->toArray());
    }

    public function deleteRole(int $id): void
    {
        $rol = Rol::findOrFail($id);
        app(RolePermissionService::class)->deleteRole($rol);
        ActividadLog::log('Eliminó un rol', 'rol', $id);
    }
}
