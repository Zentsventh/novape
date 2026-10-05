<?php

// Apply an explicit list of changed source URLs while publishing the full snapshot.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$path = $argv[1] ?? null;
if (!$path || !is_file($path)) throw new RuntimeException('Indica el archivo JSON de URLs modificadas.');
$urls = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($urls) || !array_is_list($urls)) throw new RuntimeException('Se requiere una lista de URLs.');
foreach ($urls as $url) {
    if (!is_string($url) || !str_starts_with($url, 'https://www.efe.com.pe/')) {
        throw new RuntimeException('La lista debe contener solamente URLs EFE.');
    }
}
(new Database\Seeders\EfeCatalogSeeder())->run($urls);
echo count($urls).' fichas modificadas aplicadas; catálogo completo publicado.'.PHP_EOL;
