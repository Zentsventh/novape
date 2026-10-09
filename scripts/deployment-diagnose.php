<?php

declare(strict_types=1);

// Run with PHP CLI from the project; never expose database details over HTTP.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__).'/vendor/autoload.php';
$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$report = [
    'php' => PHP_VERSION,
    'environment' => app()->environment(),
    'app_url' => config('app.url'),
    'app_key_present' => filled(config('app.key')),
    'database_connection' => config('database.default'),
    'files' => [
        'vite_manifest' => is_file(public_path('build/manifest.json')),
        'public_storage_link' => realpath(public_path('storage')) === realpath(storage_path('app/public')) && is_dir(storage_path('app/public')),
        'storage_writable_by_cli' => is_writable(storage_path()),
        'logs_writable_by_cli' => is_writable(storage_path('logs')),
        'bootstrap_cache_writable_by_cli' => is_writable(base_path('bootstrap/cache')),
    ],
];

foreach (['LB.webp', 'TELEVISORES.webp', 'cintillo_VS_01.1.webp'] as $image) {
    $report['files']['categorias_img/'.$image] = is_file(storage_path('app/public/categorias_img/'.$image));
}

try {
    $report['database_name'] = DB::connection()->getDatabaseName();
    foreach (['categoria', 'producto', 'banners', 'configuracion_sitio', 'variante', 'stock_almacen', 'sessions', 'cache', 'jobs'] as $table) {
        $report['rows'][$table] = Schema::hasTable($table) ? DB::table($table)->count() : 'missing_table';
    }
    if (is_int($report['rows']['categoria'])) {
        $report['active_root_categories'] = DB::table('categoria')->where('activa', true)->whereNull('categoria_padre_id')->count();
    }
    if (is_int($report['rows']['producto'])) {
        $query = DB::table('producto')->where('activo', true);
        if (Schema::hasColumn('producto', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $report['active_products'] = $query->count();
    }
    if (is_int($report['rows']['banners'])) {
        $report['current_active_banners'] = DB::table('banners')->where('activo', true)
            ->where(fn ($query) => $query->whereNull('fecha_inicio')->orWhere('fecha_inicio', '<=', now()))
            ->where(fn ($query) => $query->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', now()))->count();
    }
    // Check the existing encryption key without printing any credential.
    if (is_int($report['rows']['configuracion_sitio'])) {
        $report['encrypted_settings'] = ['checked' => 0, 'failed_to_decrypt' => 0];
        foreach (DB::table('configuracion_sitio')->where('valor', 'like', 'encrypted:v1:%')->pluck('valor') as $value) {
            $report['encrypted_settings']['checked']++;
            try {
                decrypt(substr($value, 13), false);
            } catch (Throwable) {
                $report['encrypted_settings']['failed_to_decrypt']++;
            }
        }
    }
} catch (Throwable $exception) {
    // Exception messages may contain credentials or row data; output only the type/code.
    $report['database_error'] = ['type' => get_class($exception), 'code' => (string) $exception->getCode()];
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR).PHP_EOL;
exit(isset($report['database_error']) ? 1 : 0);
