<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmAutomation;
use App\Services\Admin\Crm\PublicWebhookUrl;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CrmAutomationController extends Controller
{
    public function index()
    {
        $automations = CrmAutomation::orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/CRM/Automations/Index', [
            'automations' => $automations,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'trigger_type' => 'required|in:deal_created,deal_moved,deal_won,deal_lost,company_created',
            'condiciones' => 'nullable|array',
            'condiciones.*.field' => 'required|string|max:100',
            'condiciones.*.operator' => 'required|in:==,!=,>,<,>=,<=,contains',
            'condiciones.*.value' => 'present',
            'acciones' => 'required|array|min:1|max:20',
            'acciones.*.type' => 'required|in:webhook,send_email,send_coupon,create_task',
            'acciones.*.url' => 'required_if:acciones.*.type,webhook|url:https|max:2000',
            'acciones.*.message' => 'required_if:acciones.*.type,send_email,send_coupon,create_task|string|max:10000',
            'activo' => 'boolean',
        ]);

        foreach ($validated['acciones'] as $action) {
            if ($action['type'] === 'webhook') {
                try {
                    PublicWebhookUrl::resolve($action['url']);
                } catch (\InvalidArgumentException $e) {
                    throw ValidationException::withMessages(['acciones' => $e->getMessage()]);
                }
            }
        }
        CrmAutomation::create($validated);

        return redirect()->back()->with('success', 'Automatización creada exitosamente.');
    }

    public function destroy(int $id)
    {
        CrmAutomation::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Automatización eliminada.');
    }
}
