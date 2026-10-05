<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CrmSettingsService
{
    /**
     * Stores a new custom field schema.
     */
    public function storeCustomField(array $data): void
    {
        $name = strtolower(str_replace(' ', '_', trim($data['name'])));
        if (DB::table('crm_custom_fields_schema')->where('model_type', $data['model_type'])->where('name', $name)->exists()) {
            throw ValidationException::withMessages(['name' => 'Ya existe un campo con ese nombre para este tipo de registro.']);
        }
        DB::table('crm_custom_fields_schema')->insert([
            'model_type' => $data['model_type'],
            'name' => $name,
            'label' => $data['label'],
            'type' => $data['type'],
            'options' => isset($data['options']) ? json_encode($data['options'], JSON_THROW_ON_ERROR) : null,
            'required' => $data['required'] ?? false,
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
            if (! $ledgerItem || $ledgerItem->status !== 'pending') {
                return;
            }
            if ($ledgerItem->model_type !== $data['model_type'] || $ledgerItem->model_id != $data['model_id'] ||
                $ledgerItem->field_name !== $data['field_name']) {
                throw ValidationException::withMessages(['model_id' => 'La sugerencia no corresponde al registro o campo indicado.']);
            }

            if ($data['action'] === 'accept') {
                $this->acceptEvidence($ledgerItem, $ledgerItem->model_type, (int) $ledgerItem->model_id, $ledgerItem->field_name, $ledgerItem->suggested_value);
            } else {
                $this->rejectEvidence($evidenceId);
            }
        });
    }

    private function acceptEvidence(object $ledgerItem, string $modelType, int $modelId, string $fieldName, string $suggestedValue): void
    {
        $table = match ($modelType) {
            'deal' => 'crm_deals', 'company' => 'crm_companies', default => 'usuario'
        };
        $modelQuery = DB::table($table)->where('id', $modelId)->whereNull('deleted_at');

        $model = $modelQuery->lockForUpdate()->first();

        if (! $model) {
            throw ValidationException::withMessages(['model_id' => 'El registro ya no existe.']);
        }
        $customFields = $model->custom_fields ? json_decode($model->custom_fields, true) : [];
        $customFields[$fieldName] = $suggestedValue;

        $modelQuery->update([
            'custom_fields' => json_encode($customFields),
        ]);
        DB::table('crm_evidence_ledgers')->where('id', $ledgerItem->id)->update(['status' => 'accepted']);
    }

    private function rejectEvidence(int $evidenceId): void
    {
        DB::table('crm_evidence_ledgers')->where('id', $evidenceId)->update(['status' => 'rejected']);
    }
}
