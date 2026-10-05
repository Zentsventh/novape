<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Crm\StoreCustomFieldRequest;
use App\Models\CrmCustomFieldSchema;
use App\Services\Admin\Crm\CrmSettingsService;
use Inertia\Inertia;

class CrmCustomFieldController extends Controller
{
    public function index()
    {
        $fields = CrmCustomFieldSchema::orderBy('model_type')->orderBy('name')->get();

        return Inertia::render('Admin/CRM/CustomFields/Index', [
            'fields' => $fields,
        ]);
    }

    public function store(StoreCustomFieldRequest $request)
    {
        app(CrmSettingsService::class)->storeCustomField($request->validated());

        return back()->with('success', 'Campo personalizado creado correctamente.');
    }

    public function destroy(CrmCustomFieldSchema $customField)
    {
        $customField->delete();

        return back()->with('success', 'Campo personalizado eliminado correctamente.');
    }
}
