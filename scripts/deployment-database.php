<?php

declare(strict_types=1);

use Illuminate\Support\Facades\DB;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

try {
require dirname(__DIR__).'/vendor/autoload.php';
$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$connection = config('database.default');
$settings = config('database.connections.'.$connection);
if ($settings['driver'] !== 'mysql' || ! empty($settings['url'])) {
    throw new RuntimeException('Se requiere MySQL configurado con DB_DATABASE, sin DB_URL.');
}

$mode = $argv[1] ?? 'identity';
if ($mode === 'identity') {
    foreach (['database', 'username'] as $field) {
        if (! preg_match('/\A[a-zA-Z0-9_]+\z/', $settings[$field])) {
            throw new RuntimeException('Nombre de base o usuario no compatible con este procedimiento.');
        }
    }
    foreach (['categoria', 'producto', 'banners'] as $table) {
        if (DB::table($table)->count() !== 0) {
            throw new RuntimeException('El catalogo actual tiene datos; detener y revisar antes de cambiar de base.');
        }
    }
    echo $settings['database'].PHP_EOL.$settings['username'].PHP_EOL;
    exit;
}

$candidate = $argv[2] ?? '';
if (! in_array($mode, ['activate', 'verify'], true) || ! preg_match('/\Anovape_restore_[0-9_]+\z/', $candidate)) {
    throw new RuntimeException('Modo o nombre de base invalido.');
}
if ($mode === 'verify' && $settings['database'] !== $candidate) {
    throw new RuntimeException('La configuracion efectiva no apunta a la base restaurada.');
}

config(['database.connections.'.$connection.'.database' => $candidate]);
DB::purge($connection);
// Verify the import through the application's real account before switching.
foreach (['categoria' => 774, 'producto' => 10025, 'banners' => 17, 'variante' => 10025] as $table => $expected) {
    if (DB::table($table)->count() !== $expected) {
        throw new RuntimeException('La cantidad restaurada no coincide en '.$table.'. La base anterior sigue activa.');
    }
}
foreach (DB::table('configuracion_sitio')->where('valor', 'like', 'encrypted:v1:%')->pluck('valor') as $value) {
    // An incompatible key must not be silently activated.
    decrypt(substr($value, 13), false);
}
if ($mode === 'verify') {
    echo 'Base restaurada verificada.'.PHP_EOL;
    exit;
}

$envPath = base_path('.env');
$contents = file_get_contents($envPath);
if ($contents === false || ! preg_match('/^DB_DATABASE=[^\r\n]*/m', $contents)) {
    throw new RuntimeException('No se encontro DB_DATABASE en .env.');
}
$backupDirectory = storage_path('app/private/deployment-backups');
if (! is_dir($backupDirectory) && ! mkdir($backupDirectory, 0700, true)) {
    throw new RuntimeException('No se pudo crear el directorio de respaldo.');
}
chmod($backupDirectory, 0700);
$backup = $backupDirectory.'/env-before-'.$candidate;
$backupHandle = fopen($backup, 'x');
if ($backupHandle === false) {
    throw new RuntimeException('No se pudo crear un respaldo exclusivo de .env.');
}
chmod($backup, 0600);
if (fwrite($backupHandle, $contents) !== strlen($contents)) {
    fclose($backupHandle);
    throw new RuntimeException('El respaldo de .env quedo incompleto.');
}
fclose($backupHandle);
$updated = preg_replace('/^DB_DATABASE=[^\r\n]*/m', 'DB_DATABASE='.$candidate, $contents);
$temporary = tempnam(dirname($envPath), '.env.restore-');
if ($temporary === false) {
    throw new RuntimeException('No se pudo crear el archivo temporal de configuracion.');
}
chmod($temporary, fileperms($envPath) & 0777);
if (file_put_contents($temporary, $updated) !== strlen($updated) || ! rename($temporary, $envPath)) {
    throw new RuntimeException('No se pudo actualizar .env. Conserva el respaldo indicado en storage/app/private/deployment-backups.');
}
echo $backup.PHP_EOL;
} catch (Throwable $exception) {
    $message = get_class($exception) === RuntimeException::class
        ? $exception->getMessage()
        : get_class($exception).' (codigo '.(string) $exception->getCode().'). Revisar el registro privado de Laravel.';
    fwrite(STDERR, $message.PHP_EOL);
    exit(1);
}
