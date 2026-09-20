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
                if ($activity->estado === 'completado') {
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

        return Inertia::render('Admin/CRM/Tasks', [
            'tasks' => $activities
        ]);
    }

    public function complete(Request $request, CrmActivity $activity)
    {
        $activity->estado = $request->input('completado') ? 'completado' : 'pendiente';
        $activity->save();

        return redirect()->back();
    }
}
