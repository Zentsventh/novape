<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

try {
    require dirname(__DIR__).'/vendor/autoload.php';
    $app = require dirname(__DIR__).'/bootstrap/app.php';
    $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
    $migrator = $app->make('migrator');
    $repository = $migrator->getRepository();
    if (! $repository->repositoryExists()) {
        throw new RuntimeException('La base no tiene la tabla migrations. Completar la instalacion antes de desplegar.');
    }
    $pending = array_diff(array_keys($migrator->getMigrationFiles(database_path('migrations'))), $repository->getRan());
    if ($pending !== []) {
        fwrite(STDERR, "Hay migraciones pendientes. Aplicarlas con la identidad de mantenimiento y un respaldo antes de reintentar:\n".implode("\n", $pending)."\n");
        exit(2);
    }
    echo "Base compatible: no hay migraciones pendientes.\n";
} catch (Throwable $exception) {
    $message = get_class($exception) === RuntimeException::class
        ? $exception->getMessage() : get_class($exception).' (codigo '.(string) $exception->getCode().').';
    fwrite(STDERR, $message."\n");
    exit(1);
}
