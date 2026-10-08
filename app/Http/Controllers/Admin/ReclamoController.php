<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reclamo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReclamoController extends Controller
{
    public function index(Request $request)
    {
        $query = Reclamo::query()->orderBy('created_at', 'desc');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('codigo', 'like', "%{$request->search}%")
                  ->orWhere('nombres', 'like', "%{$request->search}%")
                  ->orWhere('apellidos', 'like', "%{$request->search}%")
                  ->orWhere('numero_documento', 'like', "%{$request->search}%");
            });
        }

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        $reclamos = $query->paginate(15)->withQueryString();

        return Inertia::render('Admin/Reclamos/Index', [
            'reclamos' => $reclamos,
            'filters' => $request->only(['search', 'estado'])
        ]);
    }

    public function show($id)
    {
        $reclamo = Reclamo::findOrFail($id);
        
        return Inertia::render('Admin/Reclamos/Show', [
            'reclamo' => $reclamo
        ]);
    }

    public function update(Request $request, $id)
    {
        $reclamo = Reclamo::findOrFail($id);
        
        $validated = $request->validate([
            'estado' => 'required|string|in:Pendiente,En Proceso,Resuelto,Cerrado',
            'respuesta_admin' => 'nullable|string|max:5000'
        ]);

        $reclamo->update($validated);

        return back()->with('success', 'Reclamo actualizado exitosamente.');
    }
}
