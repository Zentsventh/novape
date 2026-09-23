<?php

declare(strict_types=1);

namespace App\Services\Admin\Settings;

use App\Models\ConfiguracionSitio;
use App\Models\Rol;
use App\Models\Permiso;
use App\Models\ActividadLog;
use Illuminate\Database\Eloquent\Collection;

class SystemConfigurationService
{
    public function getSettings(): \Illuminate\Support\Collection
    {
        return ConfiguracionSitio::all()->pluck('valor', 'clave');
    }

    public function updateSettings(array $data): void
    {
        if (!empty($data['logo_url'])) {
            ConfiguracionSitio::establecer('logo_url', $data['logo_url']);
        }
        ConfiguracionSitio::establecer('nombre_sitio', $data['nombre_sitio']);
        ConfiguracionSitio::establecer('pago_tarjeta', isset($data['pago_tarjeta']) && $data['pago_tarjeta'] ? '1' : '0');
        ConfiguracionSitio::establecer('pago_transferencia', isset($data['pago_transferencia']) && $data['pago_transferencia'] ? '1' : '0');
        ConfiguracionSitio::establecer('envio_gratis', isset($data['envio_gratis']) && $data['envio_gratis'] ? '1' : '0');
        ConfiguracionSitio::establecer('igv_porcentaje', (string) $data['igv_porcentaje']);

        // WhatsApp
        if (isset($data['whatsapp_token'])) {
            ConfiguracionSitio::establecer('whatsapp_token', $data['whatsapp_token']);
        }
        if (isset($data['whatsapp_phone_number_id'])) {
            ConfiguracionSitio::establecer('whatsapp_phone_number_id', $data['whatsapp_phone_number_id']);
        }
        if (isset($data['whatsapp_verify_token'])) {
            ConfiguracionSitio::establecer('whatsapp_verify_token', $data['whatsapp_verify_token']);
        }
        if (isset($data['whatsapp_app_secret'])) {
            ConfiguracionSitio::establecer('whatsapp_app_secret', $data['whatsapp_app_secret']);
        }
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
        $rol = Rol::create([
            'nombre' => strtolower($data['nombre']),
            'descripcion' => $data['descripcion'] ?? null
        ]);

        ActividadLog::log('Creó un nuevo rol', 'rol', $rol->id, $rol->toArray());
    }

    public function deleteRole(int $id): void
    {
        $rol = Rol::findOrFail($id);

        if ($rol->nombre === 'admin') {
            throw new \Exception('No puedes eliminar el rol de Administrador.');
        }

        $rol->permisos()->detach();
        $rol->delete();

        ActividadLog::log('Eliminó un rol', 'rol', $id);
    }
}
