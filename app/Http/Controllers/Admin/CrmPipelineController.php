<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CrmDeal;
use App\Models\CrmStage;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\Admin\Crm\UpdateDealStageRequest;
use App\Http\Requests\Admin\Crm\StoreDealActivityRequest;
use App\Http\Requests\Admin\Crm\StoreDealProductRequest;
use App\Http\Requests\Admin\Crm\StoreCrmDealRequest;
use App\Http\Requests\Admin\Crm\UpdateCrmDealRequest;
use App\Http\Requests\Admin\Crm\UpdateCustomFieldsRequest;
use App\Services\Admin\Crm\CrmPipelineService;
use App\Services\Admin\Crm\CrmDealQueryService;

class CrmPipelineController extends Controller
{
    public function __construct(
        private readonly CrmPipelineService $pipelineService,
        private readonly CrmDealQueryService $dealQueryService
    ) {}

    public function index(Request $request)
    {
        $pipeline = $this->pipelineService->getPipelineData();
        $companies = \App\Models\CrmCompany::select('id', 'nombre')->get();
        $personas = \App\Models\Usuario::select('id', 'nombres', 'apellidos')->where('estado', 'activo')->get();
        
        return Inertia::render('Admin/CRM/Pipeline', [
            'pipeline' => $pipeline,
            'companies' => $companies,
            'personas' => $personas
        ]);
    }

    public function store(StoreCrmDealRequest $request)
    {
        $this->pipelineService->storeDeal($request->validated());
        return redirect()->back()->with('success', 'Oportunidad creada exitosamente.');
    }

    public function show(int $id)
    {
        $deal = $this->dealQueryService->getDealForShow($id);
        $evidenceLedger = $this->dealQueryService->getEvidenceLedger($id);
        $customFieldsSchema = $this->dealQueryService->getCustomFieldsSchema();

        return Inertia::render('Admin/CRM/Deals/Show', [
            'deal' => $deal,
            'evidenceLedger' => $evidenceLedger,
            'customFieldsSchema' => $customFieldsSchema
        ]);
    }

    public function move(UpdateDealStageRequest $request, int $id)
    {
        $deal = CrmDeal::findOrFail($id);
        $this->pipelineService->updateDealStage($deal, $request->validated());

        return redirect()->back()->with('success', 'Deal actualizado correctamente');
    }

    public function getJson(int $id)
    {
        $deal = $this->dealQueryService->getDealJson($id);
        return response()->json($deal);
    }

    public function storeActivity(StoreDealActivityRequest $request, int $id)
    {
        $deal = CrmDeal::findOrFail($id);
        $activity = $this->pipelineService->storeActivity($deal, $request->validated(), auth()->id() ?? 1);

        return response()->json([
            'message' => 'Actividad guardada correctamente',
            'activity' => $activity->load('autor')
        ]);
    }

    public function addProduct(StoreDealProductRequest $request, int $id)
    {
        $deal = CrmDeal::findOrFail($id);
        $this->pipelineService->addProduct($deal, $request->validated());

        return response()->json([
            'message' => 'Producto añadido correctamente'
        ]);
    }

    public function removeProduct(int $id, int $productId)
    {
        $deal = CrmDeal::findOrFail($id);
        $this->pipelineService->removeProduct($deal, $productId);

        return response()->json([
            'message' => 'Producto eliminado correctamente'
        ]);
    }

    public function generateQuote(int $id)
    {
        $deal = $this->dealQueryService->getDealForQuote($id);
        
        if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            return response()->json(['error' => 'La librería de PDF no está instalada. Ejecuta: composer require barryvdh/laravel-dompdf'], 500);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.crm.quote', compact('deal'));
        
        return $pdf->download('Cotizacion_Deal_'.$deal->id.'.pdf');
    }

    public function updateCustomFields(UpdateCustomFieldsRequest $request, int $id)
    {
        // El FormRequest valida que vengan los campos correctamente y verifica autorización
        $deal = CrmDeal::findOrFail($id);
        
        $this->pipelineService->updateCustomFields($deal, $request->validated()['custom_fields']);

        return back()->with('success', 'Campos personalizados actualizados correctamente');
    }
}
