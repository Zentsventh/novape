<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use Illuminate\Support\Facades\DB;
use App\Models\CrmDeal;
use App\Models\Usuario;

class CrmSettingsService
{
    /**
     * Stores a new custom field schema.
     */
    public function storeCustomField(array $data): void
    {
        DB::table('crm_custom_fields_schema')->insert([
            'model_type' => $data['model_type'],
            'name' => strtolower(str_replace(' ', '_', $data['name'])),
            'label' => $data['label'],
            'type' => $data['type'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Resolves an AI evidence suggestion (Accept or Reject) idempotently.
     */
    public function resolveEvidence(int $evidenceId, array $data): void
    {
        DB::transaction(function () use ($evidenceId, $data) {
            $ledgerItem = DB::table('crm_evidence_ledgers')
                ->where('id', $evidenceId)
                ->lockForUpdate()
                ->first();

            // Idempotency check: If it was already resolved, do nothing.
            if (!$ledgerItem || $ledgerItem->status !== 'pending') {
                return;
            }

            if ($data['action'] === 'accept') {
                $this->acceptEvidence($ledgerItem, $data['model_type'], (int)$data['model_id'], $data['field_name'], $data['suggested_value']);
            } else {
                $this->rejectEvidence($evidenceId);
            }
        });
    }

    private function acceptEvidence(object $ledgerItem, string $modelType, int $modelId, string $fieldName, string $suggestedValue): void
    {
        $table = $modelType === 'deal' ? 'crm_deals' : 'usuario';
        $modelQuery = DB::table($table)->where('id', $modelId);
        
        $model = $modelQuery->lockForUpdate()->first();
        
        if ($model) {
            $customFields = $model->custom_fields ? json_decode($model->custom_fields, true) : [];
            $customFields[$fieldName] = $suggestedValue;
            
            $modelQuery->update([
                'custom_fields' => json_encode($customFields)
            ]);
        }
        
        DB::table('crm_evidence_ledgers')->where('id', $ledgerItem->id)->update(['status' => 'accepted']);
    }

    private function rejectEvidence(int $evidenceId): void
    {
        DB::table('crm_evidence_ledgers')->where('id', $evidenceId)->update(['status' => 'rejected']);
    }
}
