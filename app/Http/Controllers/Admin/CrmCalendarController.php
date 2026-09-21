<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmActivity;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrmCalendarController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/CRM/Calendar/Index');
    }

    public function events(Request $request)
    {
        $start = $request->query('start');
        $end = $request->query('end');

        $query = CrmActivity::with(['deal'])
            ->whereNotNull('fecha_vencimiento');

        if ($start && $end) {
            $query->whereBetween('fecha_vencimiento', [$start, $end]);
        }

        $activities = $query->get();

        $events = $activities->map(function ($activity) {
            $color = '#3b82f6'; // default blue (tarea)
            if ($activity->tipo === 'llamada') $color = '#eab308'; // yellow
            if ($activity->tipo === 'email') $color = '#8b5cf6'; // purple
            if ($activity->tipo === 'reunion') $color = '#f97316'; // orange

            return [
                'id' => $activity->id,
                'title' => ($activity->deal ? $activity->deal->titulo . ' - ' : '') . ucfirst($activity->tipo),
                'start' => $activity->fecha_vencimiento,
                'allDay' => false,
                'backgroundColor' => $color,
                'borderColor' => $color,
                'extendedProps' => [
                    'contenido' => $activity->contenido,
                    'tipo' => $activity->tipo,
                    'completada' => $activity->completada,
                ]
            ];
        });

        return response()->json($events);
    }
}
