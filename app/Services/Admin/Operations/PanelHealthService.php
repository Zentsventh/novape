<?php

declare(strict_types=1);

namespace App\Services\Admin\Operations;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PanelHealthService
{
    public static function workerKey(string $connection, string $queue): string
    {
        return 'panel:worker:'.hash('sha256', $connection.':'.$queue);
    }

    public function snapshot(): array
    {
        $connection = (string) config('queue.default');
        $driver = (string) config('queue.connections.'.$connection.'.driver');
        $queue = (string) config('queue.connections.'.$connection.'.queue', 'default');
        $worker = Cache::get(self::workerKey($connection, $queue));
        $scheduler = Cache::get('panel:scheduler');
        $checks = [
            'scheduler' => ['ok' => is_numeric($scheduler) && now()->timestamp - (int) $scheduler <= 180, 'last_seen' => $scheduler],
            'worker' => ['ok' => $driver === 'sync' || (is_numeric($worker) && now()->timestamp - (int) $worker <= 180), 'last_seen' => $worker, 'connection' => $connection, 'queue' => $queue, 'driver' => $driver],
        ];
        $metrics = [];
        if ($driver === 'database') {
            $query = DB::connection(config('queue.connections.'.$connection.'.connection'))
                ->table((string) config('queue.connections.'.$connection.'.table', 'jobs'))->where('queue', $queue);
            $metrics['queue'] = [
                'waiting' => (clone $query)->whereNull('reserved_at')->count(),
                'running' => (clone $query)->whereNotNull('reserved_at')->count(),
                'oldest_created_at' => (clone $query)->min('created_at'),
            ];
        }
        $failedConnection = config('queue.failed.database');
        if (config('queue.failed.driver') === 'database-uuids' && Schema::connection($failedConnection)->hasTable((string) config('queue.failed.table', 'failed_jobs'))) {
            $metrics['failed_jobs'] = DB::connection($failedConnection)->table((string) config('queue.failed.table', 'failed_jobs'))->count();
        }
        foreach (['order_notification_outbox', 'marketing_deliveries', 'automation_executions', 'payment_reconciliations'] as $table) {
            if (Schema::hasTable($table)) {
                $metrics[$table] = DB::table($table)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status')->all();
            }
        }
        return ['checked_at' => now()->toIso8601String(), 'ok' => !in_array(false, array_column($checks, 'ok'), true), 'checks' => $checks, 'metrics' => $metrics];
    }
}
