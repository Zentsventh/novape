<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Users\StoreStaffRequest;
use App\Http\Requests\Admin\Users\UpdateStaffRequest;
use App\Models\Rol;
use App\Models\Usuario;
use App\Services\Admin\Users\UserManagementService;
use App\Support\Csv;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function __construct(
        private readonly UserManagementService $userService
    ) {}

    public function index(Request $request)
    {
        $filtros = $request->only('buscar');
        $trabajadores = $this->userService->getStaff($filtros);

        return Inertia::render('Admin/Trabajadores/Index', [
            'trabajadores' => $trabajadores,
            'filtros' => $filtros,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Trabajadores/Create', [
            'roles' => Rol::all(),
        ]);
    }

    public function store(StoreStaffRequest $request)
    {
        $this->userService->createUser($request->validated(), true);

        return redirect()->route('admin.trabajadores')->with('success', 'Trabajador creado correctamente.');
    }

    public function edit(int $id)
    {
        return Inertia::render('Admin/Trabajadores/Edit', [
            'trabajador' => Usuario::with('roles')->findOrFail($id),
            'roles' => Rol::all(),
        ]);
    }

    public function update(UpdateStaffRequest $request, int $id)
    {
        $this->userService->updateUser(Usuario::findOrFail($id), $request->validated(), true);

        return redirect()->route('admin.trabajadores')->with('success', 'Trabajador actualizado correctamente.');
    }

    public function destroy(int $id)
    {
        try {
            $this->userService->deleteUser(Usuario::findOrFail($id), auth('admin')->id() ?? 0);

            return redirect()->route('admin.trabajadores')->with('success', 'Trabajador movido a la papelera.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function toggleBloqueo(int $id)
    {
        try {
            $this->userService->toggleBlockStatus(Usuario::findOrFail($id), auth('admin')->id() ?? 0);

            return redirect()->back()->with('success', 'Estado de cuenta actualizado correctamente.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function resetPassword(int $id)
    {
        $newPassword = $this->userService->resetPassword(Usuario::findOrFail($id));

        return redirect()->back()->with('success', "Contraseña restablecida exitosamente. Nueva contraseña: {$newPassword}");
    }

    public function show(int $id)
    {
        $trabajador = Usuario::with('roles')->findOrFail($id);
        $pedidos = $trabajador->pedidos()->orderBy('id', 'desc')->limit(10)->get();
        $trabajador->setRelation('pedidos', $pedidos);

        return Inertia::render('Admin/Trabajadores/Show', [
            'trabajador' => $trabajador,
            'totalCompras' => (float) $trabajador->pedidos()->where('estado', 'completado')->sum('total'),
            'totalPedidos' => $trabajador->pedidos()->count(),
        ]);
    }

    public function export()
    {
        $clientes = Usuario::whereHas('roles', function ($q) {
            $q->where('nombre', '!=', 'cliente');
        })->withCount('pedidos')->lazyById(500);

        $rows = $clientes->map(fn ($c) => [
            $c->id,
            $c->nombres,
            $c->apellidos,
            $c->email,
            $c->telefono,
            $c->dni,
            $c->estado,
            $c->pedidos_count,
            $c->created_at,
        ]);

        return Csv::download(['ID', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'DNI', 'Estado', 'Pedidos', 'Registro'], $rows, 'trabajadores_'.date('Y-m-d').'.csv');
    }
}
