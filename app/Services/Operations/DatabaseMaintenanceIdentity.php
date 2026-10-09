<?php

declare(strict_types=1);

namespace App\Services\Operations;

use Illuminate\Support\Facades\Crypt;

final class DatabaseMaintenanceIdentity
{
    public static function path(): string
    {
        $name = (string) config('database_operations.maintenance_file', 'mariadb-maintenance.enc');
        if (basename($name) !== $name || !preg_match('/^[a-zA-Z0-9_.-]+\.enc$/D', $name)) {
            throw new \RuntimeException('Nombre de credencial de mantenimiento inválido.');
        }
        return storage_path('app/private/'.$name);
    }

    public static function apply(array $config): array
    {
        if (!app()->runningInConsole()) throw new \RuntimeException('El mantenimiento solo está disponible en consola.');
        $secret = json_decode(Crypt::decryptString(file_get_contents(self::path())), true, flags: JSON_THROW_ON_ERROR);
        if (($secret['host'] ?? '127.0.0.1') !== $config['host'] || (int) ($secret['port'] ?? 3307) !== (int) $config['port']) {
            throw new \RuntimeException('La credencial de mantenimiento pertenece a otro servidor.');
        }
        return array_replace($config, ['username'=>$secret['username'], 'password'=>$secret['password']]);
    }
}
