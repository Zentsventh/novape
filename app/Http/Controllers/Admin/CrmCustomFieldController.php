<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CrmCustomFieldSchema;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CrmCustomFieldController extends Controller
{
    public function index()
    {
        $fields = CrmCustomFieldSchema::orderBy('model_type')->orderBy('name')->get();
        return Inertia::render('Admin/CRM/CustomFields/Index', [
            'fields' => $fields
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'model_type' => 'required|in:deal,user',
            'name' => 'required|string|max:50|regex:/^[a-z0-9_]+$/',
            'label' => 'required|string|max:100',
            'type' => 'required|in:text,number,select,boolean,date',
            'options' => 'nullable|array',
            'required' => 'boolean',
        ]);

        CrmCustomFieldSchema::create($validated);

        return back()->with('success', 'Campo personalizado creado correctamente.');
    }

    public function destroy(CrmCustomFieldSchema $customField)
    {
        $customField->delete();
        return back()->with('success', 'Campo personalizado eliminado correctamente.');
    }
}
