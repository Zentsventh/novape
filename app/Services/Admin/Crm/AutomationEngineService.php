<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Models\CrmAutomation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AutomationEngineService
{
    /**
     * Dispatch an event to the automation engine.
     */
    public static function trigger(string $triggerType, Model $model, array $context = []): void
    {
        $automations = CrmAutomation::where('activo', true)
                                    ->where('trigger_type', $triggerType)
                                    ->get();

        foreach ($automations as $automation) {
            if (self::evaluateConditions($automation->condiciones, $model, $context)) {
                self::executeActions($automation->acciones, $model, $context);
            }
        }
    }

    private static function evaluateConditions(?array $conditions, Model $model, array $context): bool
    {
        if (empty($conditions)) {
            return true; // No conditions = always run
        }

        foreach ($conditions as $condition) {
            $field = $condition['field'] ?? null;
            $operator = $condition['operator'] ?? '==';
            $value = $condition['value'] ?? null;

            if (!$field) continue;

            // Determine if field is from model or context
            $actualValue = data_get($model->toArray(), $field) ?? data_get($context, $field);

            $passed = match($operator) {
                '==' => $actualValue == $value,
                '!=' => $actualValue != $value,
                '>' => $actualValue > $value,
                '<' => $actualValue < $value,
                '>=' => $actualValue >= $value,
                '<=' => $actualValue <= $value,
                'contains' => is_string($actualValue) && str_contains($actualValue, $value),
                default => false,
            };

            if (!$passed) {
                return false; // All conditions must pass (AND logic for simplicity)
            }
        }

        return true;
    }

    private static function executeActions(array $actions, Model $model, array $context): void
    {
        foreach ($actions as $action) {
            if (($action['type'] ?? '') === 'webhook') {
                self::fireWebhook($action['url'], $model, $context);
            }
        }
    }

    private static function fireWebhook(string $url, Model $model, array $context): void
    {
        try {
            Http::timeout(5)->post($url, [
                'event' => 'crm_automation',
                'model' => $model->getMorphClass(),
                'data' => $model->toArray(),
                'context' => $context
            ]);
            Log::info("Webhook fired to $url for model " . $model->getKey());
        } catch (\Exception $e) {
            Log::error("Failed to fire webhook to $url: " . $e->getMessage());
        }
    }
}
