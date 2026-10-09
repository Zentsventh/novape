<?php
declare(strict_types=1);
namespace App\Services\Operations;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

final class DatabaseBackupService
{
    private function maintenanceConfig(array $config): array
    {
        if (app()->runningInConsole() && is_file(DatabaseMaintenanceIdentity::path())) {
            $config = DatabaseMaintenanceIdentity::apply($config);
        }
        return $config;
    }

    private function clientConfig(array $config): string
    {
        $directory = storage_path('app/private/database-backups');
        if (!is_dir($directory)) mkdir($directory, 0700, true);
        $path = tempnam($directory, '.client-');
        $quote = fn ($v) => '"'.str_replace(['\\', '"', "\n", "\r"], ['\\\\', '\\"', '\\n', '\\r'], (string) $v).'"';
        file_put_contents($path, "[client]\nuser=".$quote($config['username'])."\npassword=".$quote($config['password'])."\nhost=".$quote($config['host'])."\nport=".(int)$config['port']."\n");
        if (in_array($config['host'], ['127.0.0.1', 'localhost'], true)) {
            $isMaria = str_contains(strtolower((string) (DB::selectOne('SELECT VERSION() as v')->v ?? '')), 'mariadb');
            file_put_contents($path, $isMaria ? "ssl=0\n" : "ssl-mode=DISABLED\n", FILE_APPEND);
        }
        chmod($path, 0600);
        return $path;
    }

    public function create(): array
    {
        $connection = config('database_operations.backup_connection');
        $config = config('database.connections.'.$connection);
        if (($config['driver'] ?? '') !== 'mysql') throw new \RuntimeException('Este respaldo requiere MySQL/MariaDB.');
        $config = $this->maintenanceConfig($config);
        $credentials = $this->clientConfig($config);
        $base = storage_path('app/private/database-backups/backup-'.now()->format('Ymd-His').'-'.bin2hex(random_bytes(3)));
        $plain = $base.'.sql';
        try {
            $arguments = [config('database_operations.dump_binary'), '--defaults-extra-file='.$credentials, '--single-transaction', '--quick', '--skip-lock-tables', '--hex-blob', '--skip-extended-insert', '--no-autocommit', '--result-file='.$plain, $config['database']];
            $server = DB::build($config);
            if ($server->selectOne('SELECT @@log_bin as enabled')->enabled) $arguments[] = '--master-data=2';
            $process = new Process($arguments);
            $process->setTimeout(300); $process->mustRun();
            $dump = file_get_contents($plain);
            $dump = preg_replace('/DEFINER\s*=\s*`(?:``|[^`])+`@`(?:``|[^`])+`/', '', $dump);
            $encrypted = Crypt::encryptString(gzencode($dump, 6));
            $path = $base.'.sql.gz.enc'; file_put_contents($path, $encrypted); chmod($path, 0600);
            $manifest = ['file' => basename($path), 'created_at' => now()->toIso8601String(), 'sha256' => hash_file('sha256', $path), 'encrypted' => true,
                'engine' => DB::connection($connection)->selectOne('SELECT VERSION() as version')->version, 'tables' => []];
            preg_match_all('/^CREATE TABLE `([^`]+)`/m', $dump, $tables);
            foreach ($tables[1] as $table) $manifest['tables'][$table] = 0;
            preg_match_all('/^INSERT INTO `([^`]+)`/m', $dump, $inserts);
            foreach ($inserts[1] as $table) $manifest['tables'][$table]++;
            if (preg_match("/MASTER_LOG_FILE='([^']+)', MASTER_LOG_POS=(\\d+)/", $dump, $coordinates)) {
                $manifest['binlog'] = ['file' => $coordinates[1], 'position' => (int) $coordinates[2]];
            }
            file_put_contents($base.'.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
            foreach (array_unique(array_filter([config('database_operations.offsite_disk'), config('database_operations.secondary_disk')])) as $disk) {
                if (!Storage::disk($disk)->put('database-backups/'.basename($path), $encrypted) || !Storage::disk($disk)->put('database-backups/'.basename($base).'.json', json_encode($manifest, JSON_THROW_ON_ERROR))) {
                    throw new \RuntimeException('Falló la copia adicional del respaldo; se conserva la copia local.');
                }
            }
            return $manifest;
        } finally {
            if (is_file($plain)) unlink($plain);
            if (is_file($credentials)) unlink($credentials);
        }
    }

    public function verify(string $file): array
    {
        $directory = realpath(storage_path('app/private/database-backups'));
        $path = realpath($directory.DIRECTORY_SEPARATOR.basename($file));
        if (!$path || dirname($path) !== $directory || !str_ends_with($path, '.sql.gz.enc')) throw new \RuntimeException('Selecciona un respaldo cifrado del directorio privado.');
        $manifestPath = substr($path, 0, -strlen('.sql.gz.enc')).'.json';
        $manifest = json_decode(file_get_contents($manifestPath), true, flags: JSON_THROW_ON_ERROR);
        if (!hash_equals($manifest['sha256'], hash_file('sha256', $path))) throw new \RuntimeException('Checksum de respaldo inválido.');
        $connection = config('database_operations.backup_connection');
        $config = config('database.connections.'.$connection);
        // Restoration creates triggers under binary logging and needs a separate
        // maintenance identity. The application connection remains restricted.
        $config = $this->maintenanceConfig($config);
        $credentials = $this->clientConfig($config);
        $verificationName = 'store_restore_verify_'.bin2hex(random_bytes(8));
        $source = DB::build($config);
        try {
            $source->statement('CREATE DATABASE `'.$verificationName.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            $sql = gzdecode(Crypt::decryptString(file_get_contents($path)));
            if ($sql === false) throw new \RuntimeException('Contenido de respaldo inválido.');
            $process = new Process([config('database_operations.client_binary'), '--defaults-extra-file='.$credentials, $verificationName]);
            $isolatedRestore = isset($manifest['binlog']) && is_file(DatabaseMaintenanceIdentity::path());
            $process->setInput(($isolatedRestore ? "SET SESSION sql_log_bin=0;\n" : '')."SET autocommit=0;\n".$sql."\nCOMMIT;\n"); $process->setTimeout(300); $process->mustRun();
            config(['database.connections.backup_verification' => array_merge($config, ['database' => $verificationName])]);
            DB::purge('backup_verification');
            $restored = DB::connection('backup_verification');
            foreach ($manifest['tables'] as $table => $count) {
                if ($restored->table($table)->count() !== $count) throw new \RuntimeException('Conteo restaurado diferente: '.$table);
            }
            $manifest['last_restore_verified_at'] = now()->toIso8601String();
            file_put_contents($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
            return ['verified_tables' => count($manifest['tables']), 'verified_at' => $manifest['last_restore_verified_at']];
        } finally {
            DB::purge('backup_verification');
            // Only a server-generated, explicitly checked temporary database is dropped.
            if (preg_match('/^store_restore_verify_[a-f0-9]{16}$/D', $verificationName) && $verificationName !== $config['database']) $source->statement('DROP DATABASE IF EXISTS `'.$verificationName.'`');
            unlink($credentials);
        }
    }
}
