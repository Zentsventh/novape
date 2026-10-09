<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CrmCompany;
use App\Http\Requests\Admin\Crm\StoreCrmCompanyRequest;
use App\Http\Requests\Admin\Crm\UpdateCrmCompanyRequest;
use App\Services\Admin\Crm\CrmCompanyService;
use Illuminate\Support\Facades\DB;

class CrmCompanyController extends Controller
{
    public function __construct(
        private readonly CrmCompanyService $companyService
    ) {}

    public function index(Request $request)
    {
        $filters = $request->only(['search']);
        $companies = $this->companyService->getCompanies($filters);
        
        $customFieldsSchema = DB::table('crm_custom_fields_schema')
                                ->where('model_type', 'company')
                                ->get();

        return Inertia::render('Admin/CRM/Companies/Index', [
            'companies' => $companies,
            'filters' => $filters,
            'customFieldsSchema' => $customFieldsSchema
        ]);
    }

    public function store(StoreCrmCompanyRequest $request)
    {
        $this->companyService->storeCompany($request->validated());
        return redirect()->back()->with('success', 'Empresa creada exitosamente.');
    }

    public function show(int $id)
    {
        $company = CrmCompany::with([
            'responsable', 
            'personas', 
            'deals.stage',
            'timelineEvents.actor'
        ])->findOrFail($id);

        // Sort timeline events desc inline
        $company->setRelation('timelineEvents', $company->timelineEvents->sortByDesc('created_at')->values());

        $evidenceLedger = DB::table('crm_evidence_ledgers')
                            ->where('model_type', 'company')
                            ->where('model_id', $id)
                            ->where('status', 'pending')
                            ->get();
                            
        $customFieldsSchema = DB::table('crm_custom_fields_schema')
                                ->where('model_type', 'company')
                                ->get();

        return Inertia::render('Admin/CRM/Companies/Show', [
            'company' => $company,
            'evidenceLedger' => $evidenceLedger,
            'customFieldsSchema' => $customFieldsSchema
        ]);
    }

    public function update(UpdateCrmCompanyRequest $request, int $id)
    {
        $this->companyService->updateCompany($id, $request->validated());
        return redirect()->back()->with('success', 'Empresa actualizada exitosamente.');
    }

    public function destroy(int $id)
    {
        $this->companyService->deleteCompany($id);
        return redirect()->back()->with('success', 'Empresa eliminada exitosamente.');
    }
}
