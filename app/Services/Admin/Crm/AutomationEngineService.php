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
            $type = $action['type'] ?? '';
            
            try {
                if ($type === 'webhook') {
                    self::fireWebhook($action['url'], $model, $context);
                } elseif ($type === 'send_email') {
                    self::sendEmail($action['message'], $model);
                } elseif ($type === 'send_coupon') {
                    self::sendCoupon($action['message'], $model);
                } elseif ($type === 'create_task') {
                    self::createTask($action['message'], $model);
                }
                Log::info("Automation Action executed: {$type} for model " . $model->getKey());
            } catch (\Exception $e) {
                Log::error("Automation Action failed: {$type} for model " . $model->getKey() . ". Error: " . $e->getMessage());
            }
        }
    }

    private static function fireWebhook(string $url, Model $model, array $context): void
    {
        Http::timeout(5)->post($url, [
            'event' => 'crm_automation',
            'model' => $model->getMorphClass(),
            'data' => $model->toArray(),
            'context' => $context
        ]);
    }

    private static function sendEmail(string $message, Model $model): void
    {
        // Simple logic for sending email if model is CrmDeal or has contact info
        $email = null;
        if (method_exists($model, 'company') && $model->company) {
            $email = $model->company->email;
        } elseif (isset($model->email)) {
            $email = $model->email;
        }

        if ($email) {
            \Illuminate\Support\Facades\Mail::raw($message, function($msg) use ($email) {
                $msg->to($email)->subject('Notificación Automática');
            });
        }
    }

    private static function sendCoupon(string $message, Model $model): void
    {
        // Example logic: create a 10% off coupon and send it
        $email = null;
        if (method_exists($model, 'company') && $model->company) {
            $email = $model->company->email;
        }

        if ($email) {
            $couponCode = strtoupper(substr(md5(uniqid()), 0, 8));
            \App\Models\Cupon::create([
                'codigo' => $couponCode,
                'tipo_descuento' => 'porcentaje',
                'valor' => 10,
                'activo' => true,
                'fecha_fin' => now()->addDays(30)
            ]);

            $fullMessage = $message . "\n\nTu código de cupón es: " . $couponCode;
            
            \Illuminate\Support\Facades\Mail::raw($fullMessage, function($msg) use ($email) {
                $msg->to($email)->subject('¡Tienes un cupón de regalo!');
            });
        }
    }

    private static function createTask(string $message, Model $model): void
    {
        if (get_class($model) === \App\Models\CrmDeal::class) {
            \App\Models\CrmActivity::create([
                'deal_id' => $model->id,
                'usuario_id' => 1, // System admin
                'tipo' => 'tarea',
                'contenido' => '🤖 Tarea automática: ' . $message,
                'fecha_vencimiento' => now()->addDays(1),
                'completada' => false,
            ]);
        }
    }
}
