<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Jobs\AgentResearchJob;
use App\Models\CrmCompany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CrmCompanyService
{
    /**
     * Obtains a paginated list of companies based on filters.
     */
    public function getCompanies(array $filters): LengthAwarePaginator
    {
        $query = CrmCompany::with(['responsable'])
            ->withCount(['personas', 'deals']);

        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    /**
     * Stores a new CRM company.
     */
    public function storeCompany(array $data): CrmCompany
    {
        return DB::transaction(function () use ($data) {
            $company = CrmCompany::create($data);

            // Si hay un dominio o email/website, disparamos investigación IA
            if (config('services.enrichment.url') && config('services.enrichment.token') && (! empty($company->dominio) || ! empty($company->sitio_web))) {
                AgentResearchJob::dispatch('company', $company->id, $company->dominio ?? $company->sitio_web)->afterCommit();
            }

            TimelineService::log($company, 'empresa_creada', 'Empresa creada en el CRM.');
            AutomationEngineService::trigger('company_created', $company);

            return $company;
        });
    }

    /**
     * Updates an existing CRM company.
     */
    public function updateCompany(int $id, array $data): CrmCompany
    {
        return DB::transaction(function () use ($id, $data) {
            $company = CrmCompany::lockForUpdate()->findOrFail($id);
            $company->update($data);

            return $company;
        });
    }

    /**
     * Deletes a CRM company.
     */
    public function deleteCompany(int $id): void
    {
        DB::transaction(function () use ($id) {
            $company = CrmCompany::lockForUpdate()->findOrFail($id);
            $company->delete(); // Soft delete
        });
    }
}
