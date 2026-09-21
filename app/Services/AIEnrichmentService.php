<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\CrmEvidenceLedger;
use Illuminate\Support\Facades\Log;

class AIEnrichmentService
{
    /**
     * Simulates an AI Agent researching a contact or company.
     * In a real implementation, this would call OpenAI/Anthropic and external search APIs.
     */
    public function researchEntity(string $modelType, int $modelId, string $nameOrEmail, array $schemaFields): void
    {
        Log::info("AIEnrichmentService: Investigando $modelType ID: $modelId ($nameOrEmail)");

        // 1. Fetch existing fields we want to enrich
        $fieldsToInvestigate = collect($schemaFields)->where('model_type', $modelType);

        if ($fieldsToInvestigate->isEmpty()) {
            return;
        }

        // 2. MOCK AI RESEARCH LOGIC
        // We will simulate that the AI found some data based on the requested fields.
        foreach ($fieldsToInvestigate as $field) {
            
            // Randomly decide if AI "found" something (70% chance)
            if (rand(1, 100) > 70) continue; 
            
            $suggestedValue = $this->generateMockValueForField($field->name, $field->type, $nameOrEmail);
            $confidence = rand(65, 98);
            
            if ($suggestedValue) {
                // Insert into Evidence Ledger
                CrmEvidenceLedger::create([
                    'model_type' => $modelType,
                    'model_id' => $modelId,
                    'field_name' => $field->name,
                    'suggested_value' => (string) $suggestedValue,
                    'confidence_score' => $confidence,
                    'source' => $this->getRandomSource(),
                    'status' => 'pending' // Waiting for human approval
                ]);
            }
        }
    }

    private function generateMockValueForField(string $fieldName, string $type, string $contextStr): string|int
    {
        $nameParts = explode(' ', strtolower($contextStr));
        $slug = $nameParts[0] ?? 'user';

        if (str_contains($fieldName, 'linkedin')) {
            return "https://linkedin.com/in/" . $slug . "-" . rand(100, 999);
        }
        if (str_contains($fieldName, 'industria') || str_contains($fieldName, 'sector') || $fieldName === 'industria') {
            $industries = ['Tecnología', 'Salud', 'Educación', 'Retail', 'Finanzas', 'Manufactura'];
            return $industries[array_rand($industries)];
        }
        if (str_contains($fieldName, 'tamaño') || $fieldName === 'tamaño') {
            $sizes = ['startup', 'pequeña', 'mediana', 'grande', 'enterprise'];
            return $sizes[array_rand($sizes)];
        }
        if (str_contains($fieldName, 'cargo') || str_contains($fieldName, 'puesto')) {
            $roles = ['Gerente', 'Director', 'CEO', 'Especialista', 'Analista'];
            return $roles[array_rand($roles)];
        }
        
        if (str_contains($fieldName, 'telefono')) {
            return '+51 9' . rand(10000000, 99999999);
        }
        
        if ($type === 'number') {
            return rand(100, 10000);
        }
        if ($type === 'boolean') {
            return rand(0, 1);
        }

        return "Dato sugerido por IA";
    }

    private function getRandomSource(): string
    {
        $sources = ['web_search', 'linkedin_scraper', 'email_context'];
        return $sources[array_rand($sources)];
    }
}
