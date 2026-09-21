<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmAutomation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrmAutomationController extends Controller
{
    public function index()
    {
        $automations = CrmAutomation::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/CRM/Automations/Index', [
            'automations' => $automations
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'trigger_type' => 'required|string|max:50',
            'condiciones' => 'nullable|array',
            'acciones' => 'required|array',
            'activo' => 'boolean'
        ]);

        CrmAutomation::create($validated);

        return redirect()->back()->with('success', 'Automatización creada exitosamente.');
    }

    public function destroy(int $id)
    {
        CrmAutomation::findOrFail($id)->delete();
        return redirect()->back()->with('success', 'Automatización eliminada.');
    }
}
