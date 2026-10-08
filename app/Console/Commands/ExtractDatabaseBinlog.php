<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;

class ExtractDatabaseBinlog extends Command
{
    protected $signature = 'store:extract-binlog {name : Nombre del binlog, sin extensión .enc}';
    protected $description = 'Verificar y descifrar un binlog al directorio privado de recuperación';
    public function handle(): int
    {
        $name = $this->argument('name');
        if (!preg_match('/^[a-zA-Z0-9_-]+\.\d{6}$/D', $name)) throw new \RuntimeException('Nombre de binlog inválido.');
        $directory = storage_path('app/private/database-backups/binlogs');
        $metadata = json_decode(file_get_contents($directory.'/'.$name.'.json'), true, flags: JSON_THROW_ON_ERROR);
        $source = $directory.'/'.$name.'.enc';
        if (!hash_equals($metadata['sha256'], hash_file('sha256', $source))) throw new \RuntimeException('Checksum cifrado inválido.');
        $recovery = storage_path('app/private/recovery'); if (!is_dir($recovery)) mkdir($recovery, 0700, true);
        $destination = $recovery.'/'.$name;
        if (is_file($destination)) throw new \RuntimeException('El archivo de recuperación ya existe; no se sobrescribe.');
        $input = fopen($source, 'rb'); $output = fopen($destination, 'wb'); $hash = hash_init('sha256'); $chunks = 0;
        try {
            while (($line = fgets($input)) !== false) {
                $chunk = gzdecode(Crypt::decryptString(trim($line)));
                if ($chunk === false) throw new \RuntimeException('Bloque de binlog inválido.');
                hash_update($hash, $chunk); fwrite($output, $chunk); $chunks++;
            }
            if ($chunks !== $metadata['chunks'] || !hash_equals($metadata['source_sha256'], hash_final($hash))) throw new \RuntimeException('Binlog incompleto o alterado.');
        } catch (\Throwable $exception) {
            fclose($input); fclose($output);
            if (realpath(dirname($destination)) === realpath($recovery) && is_file($destination)) unlink($destination);
            throw $exception;
        }
        fclose($input); fclose($output);
        $this->info('Binlog verificado en storage/app/private/recovery/'.$name);
        return self::SUCCESS;
    }
}
