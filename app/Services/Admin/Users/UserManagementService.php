<?php

declare(strict_types=1);

namespace App\Services\Admin\Users;

use App\Models\ActividadLog;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserManagementService
{
    public function getCustomers(array $filters): LengthAwarePaginator
    {
        $query = Usuario::query()->with('roles');

        if (! empty($filters['buscar'])) {
            $buscar = $filters['buscar'];
            $query->where(function ($q) use ($buscar) {
                $q->where('nombres', 'like', "%{$buscar}%")
                    ->orWhere('apellidos', 'like', "%{$buscar}%")
                    ->orWhere('email', 'like', "%{$buscar}%")
                    ->orWhere('dni', 'like', "%{$buscar}%");
            });
        }

        $query->where(function ($q) {
            $q->whereHas('roles', function ($q2) {
                $q2->where('nombre', 'cliente');
            })->orWhereDoesntHave('roles');
        });

        return $query->withCount('pedidos')->orderBy('id', 'desc')->paginate(12);
    }

    public function getStaff(array $filters): LengthAwarePaginator
    {
        $query = Usuario::query()->with('roles');

        if (! empty($filters['buscar'])) {
            $buscar = $filters['buscar'];
            $query->where(function ($q) use ($buscar) {
                $q->where('nombres', 'like', "%{$buscar}%")
                    ->orWhere('apellidos', 'like', "%{$buscar}%")
                    ->orWhere('email', 'like', "%{$buscar}%")
                    ->orWhere('dni', 'like', "%{$buscar}%");
            });
        }

        $query->whereHas('roles', function ($q) {
            $q->where('nombre', '!=', 'cliente');
        });

        return $query->withCount('pedidos')->orderBy('id', 'desc')->paginate(12);
    }

    public function createUser(array $data, bool $isStaff = false): Usuario
    {
        return DB::transaction(function () use ($data, $isStaff) {
            $this->assertAdminRoleAssignment($data['roles'] ?? []);
            $usuario = Usuario::create([
                'nombres' => $data['nombres'],
                'apellidos' => $data['apellidos'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'dni' => $data['dni'] ?? null,
                'telefono' => $data['telefono'] ?? null,
                'estado' => 'activo',
            ]);

            if ($isStaff && ! empty($data['roles'])) {
                $usuario->roles()->attach($data['roles']);
            }

            ActividadLog::log('Creó un nuevo '.($isStaff ? 'trabajador' : 'cliente'), 'usuario', $usuario->id, $usuario->toArray());

            return $usuario;
        });
    }

    public function updateUser(Usuario $usuario, array $data, bool $isStaff = false): Usuario
    {
        return DB::transaction(function () use ($usuario, $data, $isStaff) {
            Rol::where('nombre', 'admin')->lockForUpdate()->first();
            $usuario = Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            $this->assertAdminAccountAccess($usuario);
            $this->assertAdminRoleAssignment($data['roles'] ?? []);
            if ($isStaff && $usuario->esAdmin() && isset($data['roles']) &&
                ! Rol::whereIn('id', $data['roles'])->where('nombre', 'admin')->exists()) {
                $this->assertAnotherAdministrator($usuario);
            }
            $dataToUpdate = [
                'nombres' => $data['nombres'],
                'apellidos' => $data['apellidos'],
                'email' => $data['email'],
                'dni' => $data['dni'] ?? null,
                'telefono' => $data['telefono'] ?? null,
            ];

            if (! empty($data['password'])) {
                $dataToUpdate['password_hash'] = Hash::make($data['password']);
                $this->invalidateSessions($usuario);
            }

            $usuario->update($dataToUpdate);

            if ($isStaff && isset($data['roles'])) {
                $usuario->roles()->sync($data['roles']);
            }

            ActividadLog::log('Actualizó un usuario', 'usuario', $usuario->id, $usuario->toArray());

            return $usuario;
        });
    }

    public function deleteUser(Usuario $usuario, int $currentUserId): void
    {
        DB::transaction(function () use ($usuario, $currentUserId) {
            Rol::where('nombre', 'admin')->lockForUpdate()->first();
            $usuario = Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            $this->assertAdminAccountAccess($usuario);
            $this->assertAnotherAdministrator($usuario);
            if ($usuario->id === $currentUserId) {
                throw new \Exception('No puedes eliminar tu propia cuenta.');
            }

            $usuario->delete();
            $this->invalidateSessions($usuario);
            ActividadLog::log('Eliminó un usuario (Soft Delete)', 'usuario', $usuario->id);
        });
    }

    public function toggleBlockStatus(Usuario $usuario, int $currentUserId): void
    {
        DB::transaction(function () use ($usuario, $currentUserId) {
            Rol::where('nombre', 'admin')->lockForUpdate()->first();
            $usuario = Usuario::whereKey($usuario->id)->lockForUpdate()->firstOrFail();
            $this->assertAdminAccountAccess($usuario);
            if ($usuario->estado !== 'bloqueado') {
                $this->assertAnotherAdministrator($usuario);
            }
            if ($usuario->id === $currentUserId) {
                throw new \Exception('No puedes bloquear tu propia cuenta.');
            }

            $usuario->estado = $usuario->estado === 'bloqueado' ? 'activo' : 'bloqueado';
            $usuario->save();
            $this->invalidateSessions($usuario);

            $accion = $usuario->estado === 'bloqueado' ? 'bloqueada' : 'desbloqueada';
            ActividadLog::log("Cuenta de usuario $accion", 'usuario', $usuario->id);
        });
    }

    public function resetPassword(Usuario $usuario): string
    {
        $this->assertAdminAccountAccess($usuario);
        $newPassword = Str::random(24);
        $usuario->password_hash = Hash::make($newPassword);
        $usuario->save();
        $this->invalidateSessions($usuario);

        ActividadLog::log('Restableció contraseña de usuario', 'usuario', $usuario->id);

        return $newPassword;
    }

    private function assertAdminAccountAccess(Usuario $usuario): void
    {
        if ($usuario->esAdmin() && ! auth('admin')->user()?->esAdmin()) {
            abort(403);
        }
    }

    private function assertAdminRoleAssignment(array $roles): void
    {
        if ($roles && ! auth('admin')->user()?->esAdmin()) {
            abort(403);
        }
    }

    private function assertAnotherAdministrator(Usuario $usuario): void
    {
        if ($usuario->esAdmin() && ! Usuario::where('id', '!=', $usuario->id)->where('estado', 'activo')
            ->whereHas('roles', fn ($q) => $q->where('nombre', 'admin'))->exists()) {
            throw ValidationException::withMessages(['roles' => 'Debe permanecer al menos un administrador activo.']);
        }
    }

    private function invalidateSessions(Usuario $usuario): void
    {
        if (config('session.driver') === 'database') {
            DB::connection(config('session.connection'))->table(config('session.table', 'sessions'))
                ->where('user_id', $usuario->id)->delete();
        }
    }
}
