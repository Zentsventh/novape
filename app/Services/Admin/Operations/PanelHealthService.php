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
        if (DB::getDriverName() === 'mysql') {
            $server = DB::selectOne('SELECT VERSION() as version, @@log_bin as binlog');
            $grants = strtolower(implode(' ', array_map(fn ($row) => implode(' ', (array) $row), DB::select('SHOW GRANTS'))));
            $runtimeRestricted = !str_contains($grants, 'all privileges') && !str_contains($grants, 'grant option')
                && !preg_match('/grant (?!usage\b)[^;]* on \*\.\*/i', $grants)
                && !preg_match('/grant [^;]*\b(create|alter|drop|super|file|reload)\b[^;]* on/i', $grants);
            $checks['database_runtime_privileges'] = ['ok' => $runtimeRestricted];
            $checks['database_binlog'] = ['ok' => (bool) $server->binlog];
            $metrics['database'] = ['version' => $server->version, 'binlog' => (bool) $server->binlog];
            if (in_array(config('database.connections.mysql.host'), ['127.0.0.1', 'localhost'], true) && is_file(\App\Services\Operations\DatabaseMaintenanceIdentity::path())) {
                $archived = Cache::get('database:binlogs_archived_at');
                $checks['database_binlog_archive'] = ['ok' => is_numeric($archived) && now()->timestamp - (int) $archived <= 1200, 'last_seen' => $archived];
            }
        }
        $backups = glob(storage_path('app/private/database-backups/backup-*.json')) ?: [];
        sort($backups);
        $lastBackup = $backups ? json_decode(file_get_contents(end($backups)), true) : null;
        $verified = array_filter(array_map(fn ($file) => json_decode(file_get_contents($file), true), $backups), fn ($backup) => !empty($backup['last_restore_verified_at']));
        $checks['database_backup'] = ['ok' => $lastBackup && \Carbon\Carbon::parse($lastBackup['created_at'])->greaterThan(now()->subHours(26)), 'last_seen' => $lastBackup['created_at'] ?? null];
        $lastVerified = $verified ? end($verified) : null;
        $checks['database_restore'] = ['ok' => $lastVerified && \Carbon\Carbon::parse($lastVerified['last_restore_verified_at'])->greaterThan(now()->subDays(8)), 'last_seen' => $lastVerified['last_restore_verified_at'] ?? null];
        $metrics['backup_offsite_configured'] = (bool) config('database_operations.offsite_disk');
        $metrics['backup_secondary_configured'] = (bool) config('database_operations.secondary_disk');
        foreach (array_unique([config('storefront.queue_connection', 'storefront'), 'chatbot']) as $requiredConnection) {
            $requiredDriver = config('queue.connections.'.$requiredConnection.'.driver');
            $requiredQueue = config('queue.connections.'.$requiredConnection.'.queue', 'default');
            $seen = Cache::get(self::workerKey($requiredConnection, $requiredQueue));
            $checks['worker_'.$requiredConnection] = ['ok' => $requiredDriver === 'sync' || (is_numeric($seen) && now()->timestamp - (int) $seen <= 180),
                'last_seen' => $seen, 'connection' => $requiredConnection, 'queue' => $requiredQueue, 'driver' => $requiredDriver];
            if ($requiredDriver === 'database') {
                $jobs = DB::connection(config('queue.connections.'.$requiredConnection.'.connection'))
                    ->table(config('queue.connections.'.$requiredConnection.'.table', 'jobs'))->where('queue', $requiredQueue);
                $metrics['queue_'.$requiredConnection] = ['waiting' => (clone $jobs)->whereNull('reserved_at')->count(),
                    'running' => (clone $jobs)->whereNotNull('reserved_at')->count(), 'oldest_created_at' => (clone $jobs)->min('created_at')];
            }
        }
        $teamSeen = Cache::get(self::workerKey('database', 'team-realtime'));
        $checks['worker_team_realtime'] = ['ok' => is_numeric($teamSeen) && now()->timestamp - (int) $teamSeen <= 180,
            'last_seen' => $teamSeen, 'connection' => 'database', 'queue' => 'team-realtime', 'driver' => config('queue.connections.database.driver')];
        $teamJobs = DB::connection(config('queue.connections.database.connection'))
            ->table(config('queue.connections.database.table', 'jobs'))->where('queue', 'team-realtime');
        $metrics['queue_team_realtime'] = ['waiting' => (clone $teamJobs)->whereNull('reserved_at')->count(),
            'running' => (clone $teamJobs)->whereNotNull('reserved_at')->count(), 'oldest_created_at' => (clone $teamJobs)->min('created_at')];
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
        foreach (['storefront_tasks', 'refund_requests', 'order_notification_outbox', 'marketing_deliveries', 'automation_executions', 'payment_reconciliations'] as $table) {
            if (Schema::hasTable($table)) {
                $metrics[$table] = DB::table($table)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status')->all();
            }
        }
        if (Schema::hasTable('payment_reconciliations')) {
            $due = DB::table('payment_reconciliations')->whereIn('status',['authorizing','approved','needs_review'])->where('updated_at','<',now()->subMinutes(5))->count();
            $metrics['payments_requiring_attention'] = $due;
            $checks['payment_resolution'] = ['ok'=>$due === 0, 'pending'=>$due];
        }
        return ['checked_at' => now()->toIso8601String(), 'ok' => !in_array(false, array_column($checks, 'ok'), true), 'checks' => $checks, 'metrics' => $metrics];
    }
}
