<?php

declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\AIEnrichmentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class AgentResearchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Reintentos permitidos si falla (por ejemplo, timeout de API externa).
     */
    public int $tries = 3;

    /**
     * Segundos de espera entre reintentos.
     */
    public int $backoff = 10;

    public function __construct(
        public readonly string $modelType,
        public readonly int $modelId,
        public readonly string $contextName
    ) {}

    /**
     * Execute the job.
     */
    public function handle(AIEnrichmentService $aiService): void
    {
        // 1. Idempotency Check via Cache Lock to prevent race conditions
        // Prevents the same entity from being researched twice concurrently
        $lockKey = "agent_research_{$this->modelType}_{$this->modelId}";
        $lock = Cache::lock($lockKey, 60); // 60 seconds lock

        if (!$lock->get()) {
            // Already running in another worker
            return;
        }

        try {
            // 2. Secondary Idempotency Check: Did we already research this entity?
            // If there's already pending evidence for this model, we might skip to avoid duplicates.
            $existingEvidence = DB::table('crm_evidence_ledgers')
                ->where('model_type', $this->modelType)
                ->where('model_id', $this->modelId)
                ->where('status', 'pending')
                ->exists();

            if ($existingEvidence) {
                return;
            }

            // 3. Get all custom fields schema so the AI knows what it's looking for
            $schemaFields = DB::table('crm_custom_fields_schema')->get()->toArray();
            
            // 4. Call the AI service to investigate and propose evidence
            $aiService->researchEntity($this->modelType, $this->modelId, $this->contextName, $schemaFields);

        } finally {
            $lock->release();
        }
    }
}

