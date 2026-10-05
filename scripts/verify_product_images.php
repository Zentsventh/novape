<?php

// Read-only verification of current public galleries, independent of old folder names.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProductoImagen;
use Illuminate\Support\Facades\DB;

$products = DB::table('producto')->where('activo', true)->whereNull('deleted_at')->pluck('fuente_url', 'id');
$galleries = [];
$errors = [];
$checked = 0;
DB::table('producto_imagen')->whereIn('producto_id', $products->keys())->chunkById(500, function ($rows) use (&$galleries, &$errors, &$checked) {
    foreach ($rows as $row) {
        $url = (new ProductoImagen(['url' => $row->url]))->url;
        if (!str_starts_with((string) $url, '/storage/')) {
            $errors[] = ['image_id' => $row->id, 'reason' => 'Imagen no local; no se comprueba proveedor externo'];
            continue;
        }
        $path = storage_path('app/public/'.substr($url, 9));
        if (!is_file($path)) {
            // A concurrent organizer may have moved the file after this chunk was read.
            $fresh = DB::table('producto_imagen')->where('id', $row->id)->value('url');
            $url = (new ProductoImagen(['url' => $fresh]))->url;
            $path = storage_path('app/public/'.substr((string) $url, 9));
        }
        if (!is_file($path) || @getimagesize($path) === false) {
            $errors[] = ['image_id' => $row->id, 'reason' => 'Archivo ausente o imagen no válida'];
        } else {
            $galleries[$row->producto_id][$url] = true;
        }
        $checked++;
    }
    echo 'Imágenes comprobadas: '.$checked.PHP_EOL;
});
// Recheck failures after the scan, when concurrently moved associations may be committed.
$unresolved = [];
foreach ($errors as $error) {
    $row = DB::table('producto_imagen')->where('id', $error['image_id'])->first();
    $url = $row ? (new ProductoImagen(['url' => $row->url]))->url : null;
    $path = is_string($url) && str_starts_with($url, '/storage/') ? storage_path('app/public/'.substr($url, 9)) : null;
    if ($row && $path && is_file($path) && @getimagesize($path) !== false) $galleries[$row->producto_id][$url] = true;
    else $unresolved[] = $error;
}
$errors = $unresolved;
foreach ($products as $id => $source) {
    $minimum = str_starts_with((string) $source, 'https://www.efe.com.pe/') ? 3 : 1;
    if (count($galleries[$id] ?? []) < $minimum) $errors[] = ['product_id' => $id, 'reason' => 'Galería por debajo del mínimo: '.$minimum];
}
$report = ['checked_at' => date(DATE_ATOM), 'products' => $products->count(), 'images' => $checked, 'errors' => count($errors), 'details' => $errors];
file_put_contents(storage_path('logs/product-images-verification.json'), json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
echo json_encode(array_diff_key($report, ['details' => true]), JSON_PRETTY_PRINT).PHP_EOL;
exit($errors ? 1 : 0);
