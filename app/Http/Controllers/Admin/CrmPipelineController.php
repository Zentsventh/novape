<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Crm\StoreCrmDealRequest;
use App\Http\Requests\Admin\Crm\StoreDealActivityRequest;
use App\Http\Requests\Admin\Crm\StoreDealProductRequest;
use App\Http\Requests\Admin\Crm\UpdateCustomFieldsRequest;
use App\Http\Requests\Admin\Crm\UpdateDealStageRequest;
use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\Usuario;
use App\Models\Variante;
use App\Services\Admin\Crm\CrmDealQueryService;
use App\Services\Admin\Crm\CrmPipelineService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class CrmPipelineController extends Controller
{
    public function __construct(
        private readonly CrmPipelineService $pipelineService,
        private readonly CrmDealQueryService $dealQueryService
    ) {}

    public function index(Request $request)
    {
        $pipeline = $this->pipelineService->getPipelineData($request->only('q'));

        return Inertia::render('Admin/CRM/Pipeline', [
            'pipeline' => $pipeline['stages'],
            'dealPages' => Arr::except($pipeline['pagination'], ['data']),
            'query' => $request->query('q', ''),
        ]);
    }

    public function store(StoreCrmDealRequest $request)
    {
        $this->pipelineService->storeDeal($request->validated());

        return redirect()->back()->with('success', 'Oportunidad creada exitosamente.');
    }

    public function update(StoreCrmDealRequest $request, int $id)
    {
        $this->pipelineService->updateDeal(CrmDeal::findOrFail($id), $request->validated());

        return redirect()->back()->with('success', 'Oportunidad actualizada correctamente.');
    }

    public function destroy(int $id)
    {
        $this->pipelineService->archiveDeal(CrmDeal::findOrFail($id));

        return redirect()->back()->with('success', 'Oportunidad archivada. Su historial se conserva.');
    }

    public function show(int $id)
    {
        $deal = $this->dealQueryService->getDealForShow($id);
        $evidenceLedger = $this->dealQueryService->getEvidenceLedger($id);
        $customFieldsSchema = $this->dealQueryService->getCustomFieldsSchema();

        return Inertia::render('Admin/CRM/Deals/Show', [
            'deal' => $deal,
            'evidenceLedger' => $evidenceLedger,
            'customFieldsSchema' => $customFieldsSchema,
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
        $adminId = (int) (auth('admin')->id() ?? auth()->id() ?? 1);
        $activity = $this->pipelineService->storeActivity($deal, $request->validated(), $adminId);

        return response()->json([
            'message' => 'Actividad guardada correctamente',
            'activity' => $activity->load('autor'),
        ]);
    }

    public function addProduct(StoreDealProductRequest $request, int $id)
    {
        $deal = CrmDeal::findOrFail($id);
        $this->pipelineService->addProduct($deal, $request->validated());

        return response()->json([
            'message' => 'Producto añadido correctamente',
        ]);
    }

    public function searchVariants(Request $request)
    {
        $q = $request->validate(['q' => 'required|string|min:2|max:100'])['q'];
        $variants = Variante::with('producto:id,nombre')->where('activo', true)
            ->whereHas('producto', fn ($p) => $p->where('activo', true))
            ->where(fn ($v) => $v->where('sku', 'like', '%'.$q.'%')->orWhereHas('producto', fn ($p) => $p->where('nombre', 'like', '%'.$q.'%')))
            ->orderBy('id')->limit(20)->get()->map(fn ($v) => ['id' => $v->id, 'variante_id' => $v->id, 'producto_id' => $v->producto_id, 'nombre' => $v->producto->nombre, 'sku' => $v->sku, 'precio' => $v->precio]);

        return response()->json(['productos' => $variants]);
    }

    public function removeProduct(int $id, int $productId)
    {
        $deal = CrmDeal::findOrFail($id);
        $this->pipelineService->removeProduct($deal, $productId);

        return response()->json([
            'message' => 'Producto eliminado correctamente',
        ]);
    }

    public function generateQuote(int $id)
    {
        $deal = $this->dealQueryService->getDealForQuote($id);

        if (! class_exists(Pdf::class)) {
            return response()->json(['error' => 'La librería de PDF no está instalada. Ejecuta: composer require barryvdh/laravel-dompdf'], 500);
        }

        $pdf = Pdf::loadView('admin.crm.quote', compact('deal'));

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
