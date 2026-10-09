<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\CrmEvidenceLedger;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class AIEnrichmentService
{
    public function researchEntity(string $modelType, int $modelId, string $nameOrEmail, array $schemaFields): void
    {
        $url = config('services.enrichment.url');
        $token = config('services.enrichment.token');
        if (! $url || ! $token) {
            throw new \LogicException('El enriquecimiento requiere un proveedor de investigación configurado. No se generaron datos ni fuentes ficticias.');
        }
        $modelClass = match ($modelType) {
            'company' => CrmCompany::class, 'deal' => CrmDeal::class,
            'user' => Usuario::class, default => throw new \InvalidArgumentException('Tipo de registro desconocido.'),
        };
        if (! $modelClass::whereKey($modelId)->exists()) {
            return;
        }
        $fields = collect($schemaFields)->where('model_type', $modelType)->keyBy('name');
        if ($fields->isEmpty()) {
            return;
        }
        $response = Http::withToken($token)->acceptJson()->connectTimeout(5)->timeout(30)->post($url, [
            'model_type' => $modelType, 'model_id' => $modelId, 'context' => $nameOrEmail,
            'fields' => $fields->values()->all(),
        ])->throw();
        $data = Validator::make($response->json() ?? [], [
            'evidence' => 'required|array|max:100', 'evidence.*.field_name' => 'required|string|max:50',
            'evidence.*.value' => 'required|string|max:2000', 'evidence.*.source' => 'required|url:http,https|max:2000',
            'evidence.*.confidence' => 'required|integer|min:0|max:100',
        ])->validate();
        DB::transaction(function () use ($data, $fields, $modelType, $modelId) {
            foreach ($data['evidence'] as $evidence) {
                if (! $fields->has($evidence['field_name'])) {
                    continue;
                }
                CrmEvidenceLedger::updateOrCreate([
                    'model_type' => $modelType, 'model_id' => $modelId, 'field_name' => $evidence['field_name'], 'status' => 'pending',
                ], [
                    'suggested_value' => $evidence['value'], 'confidence_score' => $evidence['confidence'], 'source' => $evidence['source'],
                ]);
            }
        });
    }
}
