<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Crm\StoreCustomFieldRequest;
use App\Http\Requests\Admin\Crm\ResolveEvidenceRequest;
use App\Services\Admin\Crm\CrmSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CrmSettingsController extends Controller
{
    public function __construct(
        private readonly CrmSettingsService $settingsService
    ) {}

    public function objects()
    {
        $customFields = DB::table('crm_custom_fields_schema')->get();
        return Inertia::render('Admin/CRM/Settings/Objects', [
            'customFields' => $customFields
        ]);
    }

    public function storeField(StoreCustomFieldRequest $request)
    {
        $this->settingsService->storeCustomField($request->validated());
        return redirect()->back()->with('success', 'Campo personalizado creado.');
    }

    public function destroyField($id)
    {
        // Keep simple destroys inline if trivial, or move to service. It's fine here.
        DB::table('crm_custom_fields_schema')->where('id', $id)->delete();
        return redirect()->back()->with('success', 'Campo personalizado eliminado.');
    }

    public function resolveEvidence(ResolveEvidenceRequest $request, int $id)
    {
        $this->settingsService->resolveEvidence($id, $request->validated());
        return back();
    }
}
