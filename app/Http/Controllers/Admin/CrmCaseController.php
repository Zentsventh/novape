<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmCase;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrmCaseController extends Controller
{
    public function index(Request $request)
    {
        $query = CrmCase::with(['cliente', 'asignadoA', 'pedido', 'deal']);

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }

        $casos = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/CRM/Cases/Index', [
            'casos' => $casos,
            'filters' => $request->only(['estado', 'tipo'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|in:devolucion,demora,reclamo,consulta',
            'estado' => 'required|in:abierto,en_progreso,resuelto,cerrado',
            'prioridad' => 'required|in:baja,media,alta,urgente',
            'cliente_id' => 'nullable|exists:usuario,id',
            'pedido_id' => 'nullable|exists:pedido,id',
            'asignado_a' => 'nullable|exists:usuario,id',
            'deal_id' => 'nullable|exists:crm_deals,id',
        ]);

        CrmCase::create($validated);

        return redirect()->back()->with('success', 'Caso creado exitosamente');
    }

    public function update(Request $request, CrmCase $crmCase)
    {
        $validated = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'sometimes|required|in:devolucion,demora,reclamo,consulta',
            'estado' => 'sometimes|required|in:abierto,en_progreso,resuelto,cerrado',
            'prioridad' => 'sometimes|required|in:baja,media,alta,urgente',
            'cliente_id' => 'nullable|exists:usuario,id',
            'pedido_id' => 'nullable|exists:pedido,id',
            'asignado_a' => 'nullable|exists:usuario,id',
            'deal_id' => 'nullable|exists:crm_deals,id',
        ]);

        $crmCase->update($validated);

        return redirect()->back()->with('success', 'Caso actualizado exitosamente');
    }

    public function destroy(CrmCase $crmCase)
    {
        $crmCase->delete();
        return redirect()->back()->with('success', 'Caso eliminado');
    }
}
