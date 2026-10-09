<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ArchiveDatabaseBinlogs extends Command
{
    protected $signature = 'store:archive-binlogs';
    protected $description = 'Rotar y archivar binlogs locales cerrados en bloques cifrados para recuperación';
    public function handle(): int
    {
        $lock = Cache::lock('database-binlog-archive', 900);
        if (!$lock->get()) {
            $this->info('Ya existe un archivo de binlogs en ejecución.');
            return self::SUCCESS;
        }
        try { return $this->archive(); }
        finally { $lock->release(); }
    }

    private function archive(): int
    {
        $config = config('database.connections.mysql');
        if (!in_array($config['host'], ['127.0.0.1', 'localhost'], true)) throw new \RuntimeException('Configura el archivo de binlogs con el administrador del servidor remoto.');
        $config = \App\Services\Operations\DatabaseMaintenanceIdentity::apply($config);
        $server = DB::build($config);
        if (!$server->selectOne('SELECT @@log_bin as enabled')->enabled) throw new \RuntimeException('El registro binario está desactivado.');
        $server->statement('FLUSH BINARY LOGS');
        $logs = $server->select('SHOW BINARY LOGS');
        $active = end($logs)->Log_name;
        $sourceDirectory = realpath(dirname($server->selectOne('SELECT @@log_bin_basename as base')->base));
        $directory = storage_path('app/private/database-backups/binlogs');
        if (!is_dir($directory)) mkdir($directory, 0700, true);
        $archived = 0;
        foreach ($logs as $log) {
            if ($log->Log_name === $active || !preg_match('/^[a-zA-Z0-9_.-]+$/D', $log->Log_name)) continue;
            $source = realpath($sourceDirectory.DIRECTORY_SEPARATOR.$log->Log_name);
            if (!$source || dirname($source) !== $sourceDirectory) throw new \RuntimeException('Ruta de binlog inválida.');
            $path = $directory.'/'.$log->Log_name.'.enc'; $metadataPath = $directory.'/'.$log->Log_name.'.json';
            if (is_file($path) && is_file($metadataPath)) {
                $metadata = json_decode(file_get_contents($metadataPath), true);
                if (isset($metadata['sha256']) && hash_equals($metadata['sha256'], hash_file('sha256', $path))) {
                    $this->copyOffsite($path, $metadataPath, $metadata);
                    continue;
                }
            }
            $input = fopen($source, 'rb'); $output = fopen($path, 'wb'); $hash = hash_init('sha256'); $chunks = 0;
            try {
                while (!feof($input)) {
                    $chunk = fread($input, 4 * 1024 * 1024);
                    if ($chunk === '') break;
                    hash_update($hash, $chunk); fwrite($output, Crypt::encryptString(gzencode($chunk, 6))."\n"); $chunks++;
                }
            } finally { fclose($input); fclose($output); }
            $metadata = ['file' => basename($path), 'created_at' => now()->toIso8601String(), 'format' => 'laravel-encrypted-gzip-chunks-v1',
                'chunks' => $chunks, 'source_bytes' => filesize($source), 'source_sha256' => hash_final($hash), 'sha256' => hash_file('sha256', $path)];
            file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
            $this->copyOffsite($path, $metadataPath, $metadata);
            $archived++;
        }
        $this->info('Binlogs cerrados archivados y cifrados: '.$archived);
        Cache::put('database:binlogs_archived_at', now()->timestamp, 86400);
        return self::SUCCESS;
    }

    private function copyOffsite(string $path, string $metadataPath, array $metadata): void
    {
        if ($secondary = config('database_operations.secondary_disk')) {
            $stream = fopen($path, 'rb');
            try {
                if (!Storage::disk($secondary)->put('database-backups/binlogs/'.basename($path), $stream)
                    || !Storage::disk($secondary)->put('database-backups/binlogs/'.basename($metadataPath), json_encode($metadata, JSON_THROW_ON_ERROR))) {
                    throw new \RuntimeException('Falló la copia secundaria del binlog.');
                }
            } finally { fclose($stream); }
        }
        if (!($disk = config('database_operations.offsite_disk'))) return;
        if (($metadata['offsite_disk'] ?? null) === $disk && !empty($metadata['offsite_uploaded_at'])) return;
        $stream = fopen($path, 'rb');
        try {
            if (!Storage::disk($disk)->put('database-backups/binlogs/'.basename($path), $stream)) throw new \RuntimeException('Falló la copia externa del binlog.');
        } finally { fclose($stream); }
        $metadata['offsite_disk'] = $disk;
        $metadata['offsite_uploaded_at'] = now()->toIso8601String();
        if (!Storage::disk($disk)->put('database-backups/binlogs/'.basename($metadataPath), json_encode($metadata, JSON_THROW_ON_ERROR))) throw new \RuntimeException('Falló la copia externa del manifiesto de binlog.');
        file_put_contents($metadataPath, json_encode($metadata, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }
}
