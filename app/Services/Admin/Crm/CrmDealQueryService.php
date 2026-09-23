<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Models\CrmDeal;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CrmDealQueryService
{
    /**
     * Obtiene el Deal con sus relaciones necesarias para la vista Show.
     */
    public function getDealForShow(int $id): CrmDeal
    {
        $deal = CrmDeal::with([
            'cliente', 
            'empresa', 
            'stage', 
            'products.producto',
            'timelineEvents.actor'
        ])->findOrFail($id);
        
        // Ordenar eventos de timeline
        $deal->setRelation('timelineEvents', $deal->timelineEvents->sortByDesc('created_at')->values());
        
        return $deal;
    }

    /**
     * Obtiene el historial de evidencias pendientes para un Deal.
     */
    public function getEvidenceLedger(int $id): Collection
    {
        return DB::table('crm_evidence_ledgers')
            ->where('model_type', 'deal')
            ->where('model_id', $id)
            ->where('status', 'pending')
            ->get();
    }

    /**
     * Obtiene el esquema de campos personalizados (Custom Fields).
     */
    public function getCustomFieldsSchema(): Collection
    {
        return DB::table('crm_custom_fields_schema')
            ->where('model_type', 'deal')
            ->get();
    }

    /**
     * Obtiene los datos del Deal en formato ligero para JSON.
     */
    public function getDealJson(int $id): CrmDeal
    {
        return CrmDeal::with([
            'cliente', 
            'stage', 
            'activities.autor', 
            'products.producto'
        ])->findOrFail($id);
    }
    
    /**
     * Obtiene el Deal para la generación de la cotización (PDF).
     */
    public function getDealForQuote(int $id): CrmDeal
    {
        return CrmDeal::with(['cliente', 'products.producto'])->findOrFail($id);
    }
}
