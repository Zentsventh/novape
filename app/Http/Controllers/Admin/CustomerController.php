<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Users\StoreCustomerRequest;
use App\Http\Requests\Admin\Users\UpdateCustomerRequest;
use App\Http\Requests\Admin\Users\StoreCustomerNoteRequest;
use App\Services\Admin\Users\UserManagementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\Usuario;
use App\Models\Rol;
use App\Jobs\AgentResearchJob;

class CustomerController extends Controller
{
    public function apiProfile(int $id, \App\Services\GetCustomerProfileService $profileService): \Illuminate\Http\JsonResponse
    {
        return response()->json($profileService->execute($id));
    }
    public function __construct(
        private readonly UserManagementService $userService
    ) {}

    public function index(Request $request)
    {
        $filtros = $request->only('buscar');
        $clientes = $this->userService->getCustomers($filtros);

        $clientes->getCollection()->transform(function ($customer) {
            $orderCount = $customer->pedidos_count ?? 0;
            $segmento = 'Activo';
            $color = '#3b82f6';
            if ($orderCount === 0) {
                $segmento = 'Prospecto';
                $color = '#64748b';
            } elseif ($orderCount >= 5) {
                $segmento = 'VIP';
                $color = '#eab308';
            }
            $customer->segmento = ['nombre' => $segmento, 'color' => $color];
            return $customer;
        });

        $customFieldsSchema = DB::table('crm_custom_fields_schema')->where('model_type', 'user')->get();
        $evidenceLedger = DB::table('crm_evidence_ledgers')
                            ->where('model_type', 'user')
                            ->where('status', 'pending')
                            ->get();

        return Inertia::render('Admin/Clientes/Index', [
            'clientes' => $clientes,
            'filtros' => $filtros,
            'customFieldsSchema' => $customFieldsSchema,
            'evidenceLedger' => $evidenceLedger
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Clientes/Create', [
            'roles' => Rol::all()
        ]);
    }

    public function store(StoreCustomerRequest $request)
    {
        $user = $this->userService->createUser($request->validated(), false);
        
        // Dispatch the Autonomous Agent to research this new customer
        AgentResearchJob::dispatch('user', $user->id, $user->nombres . ' ' . $user->apellidos);

        return redirect()->route('admin.clientes')->with('success', 'Usuario creado correctamente.');
    }

    public function edit(int $id)
    {
        return Inertia::render('Admin/Clientes/Edit', [
            'cliente' => Usuario::with('roles')->findOrFail($id),
            'roles' => Rol::all()
        ]);
    }

    public function update(UpdateCustomerRequest $request, int $id)
    {
        $this->userService->updateUser(Usuario::findOrFail($id), $request->validated(), false);
        return redirect()->route('admin.clientes')->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(int $id)
    {
        try {
            $this->userService->deleteUser(Usuario::findOrFail($id), auth('admin')->id() ?? 0);
            return redirect()->route('admin.clientes')->with('success', 'Usuario movido a la papelera.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return redirect()->back()->with('error', 'No se seleccionaron usuarios.');
        }

        try {
            $count = 0;
            foreach ($ids as $id) {
                $user = Usuario::find($id);
                if ($user) {
                    $this->userService->deleteUser($user, auth('admin')->id() ?? 0);
                    $count++;
                }
            }
            return redirect()->route('admin.clientes')->with('success', "{$count} usuarios movidos a la papelera.");
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
        $cliente = Usuario::with([
            'notas' => function ($q) {
                $q->with('autor')->orderBy('created_at', 'desc');
            },
            'crmDeals' => function ($q) {
                $q->with('stage')->orderBy('created_at', 'desc');
            },
            'omnichannelContacts.conversations' => function ($q) {
                $q->orderBy('last_message_at', 'desc');
            },
            'carrito.items.producto',
            'listas.items.producto'
        ])->findOrFail($id);

        $pedidos = $cliente->pedidos()->with(['items.producto'])->orderBy('id', 'desc')->get();
        $cliente->setRelation('pedidos', $pedidos);

        // LTV calculation
        $ltv = (float) $pedidos->where('estado', 'completado')->sum('total');

        return Inertia::render('Admin/Clientes/Show', [
            'cliente' => $cliente,
            'totalCompras' => $ltv,
            'totalPedidos' => $pedidos->count(),
        ]);
    }

    public function export()
    {
        $clientes = Usuario::where(function ($q) {
            $q->whereHas('roles', function ($q2) {
                $q2->where('nombre', 'cliente');
            })->orWhereDoesntHave('roles');
        })->withCount('pedidos')->get();

        $csv = "ID,Nombres,Apellidos,Email,Teléfono,DNI,Estado,Pedidos,Registro\n";
        foreach ($clientes as $c) {
            $csv .= implode(',', [
                $c->id,
                '"' . $c->nombres . '"',
                '"' . $c->apellidos . '"',
                $c->email,
                $c->telefono,
                $c->dni,
                $c->estado,
                $c->pedidos_count,
                $c->created_at,
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="clientes_' . date('Y-m-d') . '.csv"',
        ]);
    }

    public function storeNota(StoreCustomerNoteRequest $request, int $id)
    {
        \App\Models\ClienteNota::create([
            'cliente_id' => $id,
            'autor_id' => auth('admin')->id(),
            'nota' => $request->nota,
        ]);
        \App\Models\ActividadLog::log('Añadió una nota al cliente', 'usuario', $id);
        return redirect()->back()->with('success', 'Nota añadida correctamente.');
    }

    public function destroyNota(int $id, int $notaId)
    {
        \App\Models\ClienteNota::where('cliente_id', $id)->findOrFail($notaId)->delete();
        return redirect()->back()->with('success', 'Nota eliminada correctamente.');
    }
}
