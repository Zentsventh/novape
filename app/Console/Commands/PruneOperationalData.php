<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneOperationalData extends Command
{
    protected $signature = 'store:prune-operational';
    protected $description = 'Eliminar sesiones caducadas; conservar documentos y eventos financieros';
    public function handle(): int
    {
        $expired = DB::table('sessions')->where('last_activity', '<', now()->subMinutes((int) config('session.lifetime'))->timestamp)->delete();
        $this->info('Sesiones caducadas eliminadas: '.$expired);
        $directory = realpath(storage_path('app/private/database-backups'));
        $verifiedFiles = array_values(array_filter(glob($directory.'/backup-*.json') ?: [], fn ($file) => !empty(json_decode(file_get_contents($file), true)['last_restore_verified_at'])));
        sort($verifiedFiles);
        $keep = array_slice($verifiedFiles, -2);
        foreach (glob($directory.'/backup-*.json') ?: [] as $file) {
            if (in_array($file, $keep, true)) continue;
            $manifest = json_decode(file_get_contents($file), true);
            // Retain unverified backups and all backups within the retention period.
            if (empty($manifest['last_restore_verified_at']) || \Carbon\Carbon::parse($manifest['created_at'])->greaterThan(now()->subDays((int) config('database_operations.retention_days')))) continue;
            $backup = realpath($directory.'/'.basename($manifest['file']));
            if ($backup && dirname($backup) === $directory && str_ends_with($backup, '.sql.gz.enc')) { unlink($backup); unlink($file); }
        }
        return self::SUCCESS;
    }
}
