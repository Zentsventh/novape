<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CrmActivity;
use Inertia\Inertia;

class CrmTaskController extends Controller
{
    public function index()
    {
        $activities = CrmActivity::with(['deal.cliente'])
            ->orderBy('fecha_vencimiento', 'asc')
            ->get()
            ->map(function ($activity) {
                // Categorize by date: overdue, today, upcoming
                $status = 'upcoming';
                if ($activity->completada) {
                    $status = 'completed';
                } elseif ($activity->fecha_vencimiento) {
                    $dueDate = \Carbon\Carbon::parse($activity->fecha_vencimiento)->startOfDay();
                    $today = now()->startOfDay();
                    if ($dueDate->lt($today)) {
                        $status = 'overdue';
                    } elseif ($dueDate->eq($today)) {
                        $status = 'today';
                    }
                }

                $activity->time_status = $status;
                return $activity;
            });

        $deals = \App\Models\CrmDeal::with('cliente')->orderBy('titulo')->get();

        return Inertia::render('Admin/CRM/Tasks', [
            'tasks' => $activities,
            'deals' => $deals
        ]);
    }

    public function complete(Request $request, CrmActivity $activity)
    {
        $activity->completada = $request->input('completado') ? true : false;
        $activity->save();

        return redirect()->back();
    }

    public function store(Request $request)
    {
        $request->validate([
            'deal_id' => 'required|exists:crm_deals,id',
            'tipo' => 'required|string',
            'contenido' => 'required|string',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        CrmActivity::create([
            'deal_id' => $request->deal_id,
            'usuario_id' => auth()->id() ?? 1, // Fallback si auth no está disponible en esta capa
            'tipo' => $request->tipo,
            'contenido' => $request->contenido,
            'fecha_vencimiento' => $request->fecha_vencimiento,
            'completada' => false,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, CrmActivity $activity)
    {
        $request->validate([
            'deal_id' => 'required|exists:crm_deals,id',
            'tipo' => 'required|string',
            'contenido' => 'required|string',
            'fecha_vencimiento' => 'nullable|date',
        ]);

        $activity->update([
            'deal_id' => $request->deal_id,
            'tipo' => $request->tipo,
            'contenido' => $request->contenido,
            'fecha_vencimiento' => $request->fecha_vencimiento,
        ]);

        return redirect()->back();
    }

    public function destroy(CrmActivity $activity)
    {
        $activity->delete();
        return redirect()->back();
    }
}
