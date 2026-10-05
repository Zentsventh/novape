<?php

namespace App\Services\AI;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class BusinessAutomationService
{
    public function settings(): array
    {
        $saved = DB::table('business_automation_settings')->where('id', 1)->value('settings');
        return array_replace([
            'business_name' => 'Novape', 'store_enabled' => true, 'panel_enabled' => true, 'whatsapp_enabled' => true,
            'high_value_threshold' => 10000, 'bulk_quantity_threshold' => 10, 'timezone' => 'America/Lima',
            'knowledge' => '', 'store_instructions' => '', 'panel_instructions' => '',
            'welcome_message' => 'Hola, soy el asistente de Novape. Puedo ayudarte con productos, pedidos y citas comerciales.',
            'out_of_hours_message' => 'Nuestro equipo comercial responderá en su siguiente horario de atención. Puedes consultar productos o agendar una cita mientras tanto.',
            'business_hours' => array_fill_keys(range(1, 5), [['start' => '09:00', 'end' => '18:00']]) + [6 => [['start' => '09:00', 'end' => '13:00']], 7 => []],
        ], $saved ? json_decode($saved, true, flags: JSON_THROW_ON_ERROR) : []);
    }

    public function process(string $scope, string $trigger, array $context, ?int $conversationId = null, ?int $actorId = null, bool $dryRun = false): array
    {
        $eventKey = ! $dryRun && ! empty($context['event_id']) ? hash('sha256', json_encode([$scope, $trigger, $conversationId, $actorId, $context['event_id']], JSON_THROW_ON_ERROR)) : null;
        if ($eventKey && ($previous = DB::table('business_automation_runs')->where('event_key', $eventKey)->first())) return $this->result($previous, true);
        $settings = $this->settings();
        $enabled = $settings[match ($scope) { 'panel' => 'panel_enabled', 'whatsapp' => 'whatsapp_enabled', default => 'store_enabled' }];
        $workflows = $enabled ? DB::table('business_workflows')->where('enabled', true)->whereIn('scope', [$scope, 'all'])->where('trigger', $trigger)->orderBy('priority')->orderBy('id')->limit(100)->get() : collect();
        $actions = []; $matched = []; $seen = [];
        foreach ($workflows as $workflow) {
            $conditions = json_decode($workflow->conditions, true, flags: JSON_THROW_ON_ERROR);
            if (! $this->matches($conditions, $context, $settings)) continue;
            $matched[] = ['id' => $workflow->id, 'name' => $workflow->name, 'version' => $workflow->version];
            foreach (json_decode($workflow->actions, true, flags: JSON_THROW_ON_ERROR) as $index => $action) {
                $signature = hash('sha256', json_encode($action, JSON_THROW_ON_ERROR));
                if (isset($seen[$signature])) continue;
                $seen[$signature] = true;
                $action['step_key'] = hash('sha256', $workflow->id.':'.$workflow->version.':'.$index);
                $action['workflow_id'] = $workflow->id;
                $actions[] = $action;
            }
        }
        $context = Arr::only($context, ['text', 'amount', 'quantity', 'is_company', 'channel', 'event_id']);
        if (isset($context['text'])) $context['text'] = mb_substr((string) $context['text'], 0, 2000);
        $row = ['event_key' => $eventKey, 'scope' => $scope, 'trigger' => $trigger, 'conversation_id' => $conversationId, 'actor_id' => $actorId,
            'status' => $dryRun ? 'simulated' : (count($actions) ? 'evaluated' : 'completed'), 'dry_run' => $dryRun,
            'context' => json_encode($context, JSON_THROW_ON_ERROR), 'actions' => json_encode($actions, JSON_THROW_ON_ERROR), 'matched_rules' => json_encode($matched, JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()];
        if ($eventKey) {
            DB::table('business_automation_runs')->insertOrIgnore($row);
            $saved = DB::table('business_automation_runs')->where('event_key', $eventKey)->first();
        } else $saved = DB::table('business_automation_runs')->find(DB::table('business_automation_runs')->insertGetId($row));
        return $this->result($saved);
    }

    private function result(object $run, bool $replayed = false): array
    {
        return ['run_id' => $run->id, 'actions' => json_decode($run->actions, true), 'matched_rules' => json_decode($run->matched_rules, true), 'dry_run' => (bool) $run->dry_run, 'replayed' => $replayed, 'status' => $run->status];
    }

    public function matches(array $conditions, array $context, array $settings): bool
    {
        foreach ($conditions as $condition) {
            $actual = $context[$condition['field']] ?? null;
            $value = $condition['value'];
            if (is_string($value) && in_array($value, ['$high_value_threshold', '$bulk_quantity_threshold'], true)) $value = $settings[substr($value, 1)];
            $passed = match ($condition['operator']) {
                'gt' => is_numeric($actual) && is_numeric($value) && (float) $actual > (float) $value,
                'gte' => is_numeric($actual) && is_numeric($value) && (float) $actual >= (float) $value,
                'eq' => $actual !== null && (is_bool($actual) ? $actual === filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) : (string) $actual === (string) $value),
                'contains' => is_string($actual) && is_string($value) && $value !== '' && mb_stripos($actual, $value) !== false,
                default => false,
            };
            if (! $passed) return false;
        }
        return true;
    }

    /** Commit business writes and the step receipt together; retries cannot duplicate completed actions. */
    public function once(int $runId, string $stepKey, callable $action): array
    {
        return DB::transaction(function () use ($runId, $stepKey, $action) {
            $run = DB::table('business_automation_runs')->where('id', $runId)->lockForUpdate()->first();
            if (! $run || $run->dry_run) throw new \LogicException('La simulación no ejecuta acciones.');
            $previous = DB::table('business_automation_steps')->where('run_id', $runId)->where('step_key', $stepKey)->first();
            if ($previous) return json_decode($previous->result ?? '[]', true);
            $result = $action();
            DB::table('business_automation_steps')->insert(['run_id' => $runId, 'step_key' => $stepKey, 'status' => 'completed', 'result' => json_encode($result, JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now()]);
            return $result;
        });
    }

    public function finish(int $runId, array $results, ?string $error = null): void
    {
        DB::table('business_automation_runs')->where('id', $runId)->where('dry_run', false)->update(['status' => $error ? 'failed' : 'completed', 'results' => json_encode($results, JSON_THROW_ON_ERROR), 'error' => $error ? mb_substr($error, 0, 1000) : null, 'updated_at' => now()]);
    }
}
