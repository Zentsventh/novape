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

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->where('titulo', 'like', '%' . $search . '%');
                }
            });
        }

        $casos = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Admin/CRM/Cases/Index', [
            'casos' => $casos,
            'filters' => $request->only(['search', 'estado', 'tipo'])
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

        $crmCase = CrmCase::create($validated);

        \App\Services\Admin\Crm\AutomationEngineService::trigger('case_created', $crmCase);

        return redirect()->back()->with('success', 'Caso creado exitosamente');
    }

    public function show(CrmCase $crmCase)
    {
        $crmCase->load([
            'cliente', 
            'asignadoA', 
            'pedido', 
            'deal',
            'omnichannelConversation',
            'notas' => function ($query) {
                $query->with('autor');
            },
            'actividades' => function ($query) {
                $query->with('usuario');
            }
        ]);

        return Inertia::render('Admin/CRM/Cases/Show', [
            'crmCase' => $crmCase
        ]);
    }

    public function addNote(Request $request, CrmCase $crmCase)
    {
        $validated = $request->validate([
            'contenido' => 'required|string'
        ]);

        $crmCase->notas()->create([
            'contenido' => $validated['contenido'],
            'usuario_id' => auth()->id()
        ]);

        return redirect()->back()->with('success', 'Nota añadida al caso');
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

        return redirect()->back()->with('success', 'Caso eliminado exitosamente');
    }
}
