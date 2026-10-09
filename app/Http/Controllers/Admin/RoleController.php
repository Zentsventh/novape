<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Roles\StoreRoleRequest;
use App\Http\Requests\Admin\Roles\UpdateRoleRequest;
use App\Services\Admin\Roles\RolePermissionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Rol;
use App\Models\Permiso;

class RoleController extends Controller
{
    public function __construct(
        private readonly RolePermissionService $roleService
    ) {}

    public function index(Request $request)
    {
        $filtros = $request->only('buscar');
        return Inertia::render('Admin/Roles/Index', [
            'roles' => $this->roleService->getRoles($filtros),
            'filtros' => $filtros
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Roles/Create', [
            'permisos' => Permiso::all()
        ]);
    }

    public function store(StoreRoleRequest $request)
    {
        $this->roleService->createRole($request->validated());
        return redirect()->route('admin.roles')->with('success', 'Rol creado exitosamente.');
    }

    public function edit(int $id)
    {
        return Inertia::render('Admin/Roles/Edit', [
            'rol' => Rol::with('permisos')->findOrFail($id),
            'permisos' => Permiso::all()
        ]);
    }

    public function update(UpdateRoleRequest $request, int $id)
    {
        $this->roleService->updateRole(Rol::findOrFail($id), $request->validated());
        return redirect()->route('admin.roles')->with('success', 'Rol actualizado exitosamente.');
    }

    public function destroy(int $id)
    {
        try {
            $this->roleService->deleteRole(Rol::findOrFail($id));
            return redirect()->route('admin.roles')->with('success', 'Rol eliminado exitosamente.');
        } catch (\Exception $e) {
            return redirect()->route('admin.roles')->with('error', $e->getMessage());
        }
    }
}
