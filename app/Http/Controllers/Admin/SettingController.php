<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Settings\UpdateSettingRequest;
use App\Http\Requests\Admin\Settings\SyncRolePermissionsRequest;
use App\Http\Requests\Admin\Roles\StoreRoleRequest;
use App\Services\Admin\Settings\SystemConfigurationService;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function __construct(
        private readonly SystemConfigurationService $configService
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Ajustes/Index', [
            'configuraciones' => $this->configService->getSettings()
        ]);
    }

    public function update(UpdateSettingRequest $request)
    {
        $this->configService->updateSettings($request->validated());
        return redirect()->route('admin.ajustes')->with('success', 'Configuración actualizada exitosamente.');
    }

    public function rolesIndex()
    {
        return Inertia::render('Admin/Ajustes/Permisos', [
            'roles' => $this->configService->getRoles(),
            'permisos' => $this->configService->getPermissions()
        ]);
    }

    public function rolesSyncPermisos(SyncRolePermissionsRequest $request)
    {
        $this->configService->syncRolePermissions($request->validated());
        return redirect()->back()->with('success', 'Permisos actualizados correctamente.');
    }

    public function storeRole(StoreRoleRequest $request)
    {
        $this->configService->createRole($request->validated());
        return redirect()->back()->with('success', 'Rol creado exitosamente.');
    }

    public function destroyRole(int $id)
    {
        try {
            $this->configService->deleteRole($id);
            return redirect()->back()->with('success', 'Rol eliminado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
