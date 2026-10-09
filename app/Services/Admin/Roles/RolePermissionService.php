<?php

declare(strict_types=1);

namespace App\Services\Admin\Roles;

use App\Models\Rol;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RolePermissionService
{
    public function getRoles(array $filters): LengthAwarePaginator
    {
        $query = Rol::withCount('usuarios')->where('nombre', '!=', 'cliente');

        if (! empty($filters['buscar'])) {
            $buscar = $filters['buscar'];
            $query->where('nombre', 'like', "%{$buscar}%")
                ->orWhere('descripcion', 'like', "%{$buscar}%");
        }

        return $query->paginate(12);
    }

    public function createRole(array $data): Rol
    {
        abort_unless(auth('admin')->user()?->esAdmin(), 403);

        return DB::transaction(function () use ($data) {
            $rol = Rol::create([
                'nombre' => strtolower($data['nombre']),
                'descripcion' => $data['descripcion'],
            ]);

            if (! empty($data['permisos'])) {
                $rol->permisos()->attach($data['permisos']);
            }
            \App\Services\Operations\OperationEvents::record('role.created', 'rol', $rol->id, ['permissions' => array_values($data['permisos'] ?? [])]);

            return $rol;
        });
    }

    public function updateRole(Rol $rol, array $data): Rol
    {
        if (in_array($rol->nombre, ['admin', 'cliente', 'cajero', 'almacen'], true) && strtolower($data['nombre']) !== $rol->nombre) {
            throw ValidationException::withMessages(['nombre' => 'No se puede renombrar un rol base.']);
        }

        abort_unless(auth('admin')->user()?->esAdmin(), 403);

        return DB::transaction(function () use ($rol, $data) {
            $rol->update([
                'nombre' => strtolower($data['nombre']),
                'descripcion' => $data['descripcion'],
            ]);

            $rol->permisos()->sync($data['permisos'] ?? []);
            \App\Services\Operations\OperationEvents::record('role.permissions_changed', 'rol', $rol->id, ['permissions' => array_values($data['permisos'] ?? [])]);

            return $rol;
        });
    }

    public function deleteRole(Rol $rol): void
    {
        abort_unless(auth('admin')->user()?->esAdmin(), 403);
        if ($rol->nombre === 'cliente' || $rol->usuarios()->exists()) {
            throw ValidationException::withMessages(['rol' => 'No se puede eliminar un rol base o asignado a usuarios.']);
        }
        if (in_array($rol->nombre, ['admin', 'cajero', 'almacen'])) {
            throw new \Exception('No se pueden eliminar los roles base del sistema.');
        }

        DB::transaction(function () use ($rol) {
            \App\Services\Operations\OperationEvents::record('role.deleted', 'rol', $rol->id, ['role' => $rol->nombre]);
            $rol->permisos()->detach();
            $rol->usuarios()->detach();
            $rol->delete();
        });
    }
}
