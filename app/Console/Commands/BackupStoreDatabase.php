<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;

class BackupStoreDatabase extends Command
{
    protected $signature = 'store:database-backup {--verify : Restaurar en una base temporal y comprobar conteos}';
    protected $description = 'Crear un respaldo comprimido y cifrado; conservar APP_KEY fuera del servidor';
    public function handle(\App\Services\Operations\DatabaseBackupService $service): int
    {
        $manifest = $service->create();
        $this->info('Respaldo cifrado: '.$manifest['file']);
        if ($this->option('verify')) $this->info(json_encode($service->verify($manifest['file']), JSON_THROW_ON_ERROR));
        return self::SUCCESS;
    }
}
