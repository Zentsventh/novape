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
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
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
        $context['event_id'] ??= (string) Str::uuid();
        $automations = CrmAutomation::where('activo', true)
            ->where('trigger_type', $triggerType)
            ->get();

        foreach ($automations as $automation) {
            if (self::evaluateConditions($automation->condiciones, $model, $context)) {
                self::executeActions($automation->acciones, $model, array_merge($context, ['automation_id' => $automation->id]));
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
        foreach ($actions as $index => $action) {
            $type = $action['type'] ?? '';
            $key = ['event_id' => $context['event_id'], 'automation_id' => $context['automation_id'], 'action_index' => $index];
            DB::table('automation_executions')->insertOrIgnore($key + ['status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
            $claimed = DB::table('automation_executions')->where($key)->where('status', 'pending')->update(['status' => 'processing', 'updated_at' => now()]);
            if (! $claimed) {
                continue;
            }

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
                DB::table('automation_executions')->where($key)->update(['status' => 'completed', 'updated_at' => now()]);
                Log::info("Automation Action executed: {$type} for model ".$model->getKey());
            } catch (\Exception $e) {
                DB::table('automation_executions')->where($key)->update(['status' => 'failed', 'error' => mb_substr($e->getMessage(), 0, 1000), 'updated_at' => now()]);
                Log::error("Automation Action failed: {$type} for model ".$model->getKey().'. Error: '.$e->getMessage());
                throw $e;
            }
        }
    }

    private static function fireWebhook(string $url, Model $model, array $context): void
    {
        [$host, $address] = PublicWebhookUrl::resolve($url);
        $response = Http::connectTimeout(5)->timeout(15)->withoutRedirecting()
            ->withOptions(['curl' => [CURLOPT_RESOLVE => [$host.':443:'.$address]]])->post($url, [
                'event' => 'crm_automation',
                'model' => $model->getMorphClass(),
                'data' => Arr::only($model->toArray(), ['id', 'titulo', 'nombre', 'estado', 'stage_id', 'valor']),
                'context' => Arr::only($context, ['event_id', 'from_stage_id', 'to_stage_id', 'actor_id']),
            ])->throw();
        if ($response->redirect()) {
            throw new \RuntimeException('El webhook no admite redirecciones.');
        }
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
