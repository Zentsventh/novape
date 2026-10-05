<?php

declare(strict_types=1);

namespace App\Services\Admin\Crm;

use App\Jobs\RunCrmAutomationJob;
use App\Models\CrmActivity;
use App\Models\CrmAutomation;
use App\Models\CrmCompany;
use App\Models\CrmDeal;
use App\Models\Cupon;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AutomationEngineService
{
    /**
     * Dispatch an event to the automation engine.
     */
    public static function trigger(string $triggerType, Model $model, array $context = []): void
    {
        RunCrmAutomationJob::dispatch($triggerType, $model, array_merge($context, ['actor_id' => auth('admin')->id()]))->afterCommit();
    }

    public static function run(string $triggerType, Model $model, array $context = []): void
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

            if (! $field) {
                return false;
            }

            // Determine if field is from model or context
            $actualValue = data_get($model->toArray(), $field) ?? data_get($context, $field);

            $passed = match ($operator) {
                '==' => $actualValue == $value,
                '!=' => $actualValue != $value,
                '>' => $actualValue > $value,
                '<' => $actualValue < $value,
                '>=' => $actualValue >= $value,
                '<=' => $actualValue <= $value,
                'contains' => is_string($actualValue) && is_string($value) && str_contains($actualValue, $value),
                default => false,
            };

            if (! $passed) {
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
                    self::createTask($action['message'], $model, $context);
                } else {
                    throw new \InvalidArgumentException('Tipo de acción no soportado.');
                }
                Log::info("Automation Action executed: {$type} for model ".$model->getKey());
            } catch (\Exception $e) {
                Log::error("Automation Action failed: {$type} for model ".$model->getKey().'. Error: '.$e->getMessage());
                throw $e;
            }
        }
    }

    private static function fireWebhook(string $url, Model $model, array $context): void
    {
        Http::connectTimeout(5)->timeout(15)->post($url, [
            'event' => 'crm_automation',
            'model' => $model->getMorphClass(),
            'data' => $model->toArray(),
            'context' => $context,
        ])->throw();
    }

    private static function sendEmail(string $message, Model $model): void
    {
        // Simple logic for sending email if model is CrmDeal or has contact info
        $email = self::recipient($model);

        if ($email) {
            Mail::raw($message, function ($msg) use ($email) {
                $msg->to($email)->subject('Notificación Automática');
            });
        }
    }

    private static function sendCoupon(string $message, Model $model): void
    {
        // Example logic: create a 10% off coupon and send it
        $email = self::recipient($model);

        if ($email) {
            $couponCode = strtoupper(Str::random(12));
            Cupon::create([
                'codigo' => $couponCode,
                'tipo' => 'porcentaje',
                'valor' => 10,
                'activo' => true,
                'fecha_fin' => now()->addDays(30),
            ]);

            $fullMessage = $message."\n\nTu código de cupón es: ".$couponCode;

            Mail::raw($fullMessage, function ($msg) use ($email) {
                $msg->to($email)->subject('¡Tienes un cupón de regalo!');
            });
        }
    }

    private static function recipient(Model $model): string
    {
        $email = $model instanceof CrmDeal ? ($model->cliente?->email ?: $model->empresa?->email) : $model->getAttribute('email');
        if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('La automatización no tiene un destinatario válido.');
        }

        return $email;
    }

    private static function createTask(string $message, Model $model, array $context): void
    {
        if ($model instanceof CrmDeal || $model instanceof CrmCompany) {
            $actor = Usuario::where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', '!=', 'cliente'));
            $authorId = ! empty($context['actor_id']) ? (clone $actor)->whereKey($context['actor_id'])->value('id') : null;
            $authorId ??= $actor->orderBy('id')->value('id');
            if (! $authorId) {
                throw new \RuntimeException('No hay un trabajador activo para asignar la tarea.');
            }
            CrmActivity::create([
                'deal_id' => $model instanceof CrmDeal ? $model->id : null,
                'empresa_id' => $model instanceof CrmCompany ? $model->id : $model->empresa_id,
                'usuario_id' => $authorId,
                'tipo' => 'tarea',
                'contenido' => '🤖 Tarea automática: '.$message,
                'fecha_vencimiento' => now()->addDays(1),
                'completada' => false,
            ]);
        } else {
            throw new \InvalidArgumentException('Este registro no admite tareas CRM.');
        }
    }
}
