<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Services\Catalog\CatalogQueryService;

function inventoryFingerprint(): string
{
    $hash = hash_init('sha256');
    $tables = [
        'variante' => ['id', 'stock', 'stock_reservado'],
        'stock_almacen' => ['id', 'almacen_id', 'variante_id', 'cantidad'],
        'movimientos_almacen' => ['id', 'almacen_id', 'variante_id', 'tipo', 'cantidad', 'referencia'],
    ];
    foreach ($tables as $table => $columns) {
        DB::table($table)->select($columns)->chunkById(500, function ($rows) use ($hash, $table) {
            foreach ($rows as $row) hash_update($hash, $table.':'.json_encode($row, JSON_THROW_ON_ERROR)."\n");
        });
    }
    return hash_final($hash);
}
if (in_array('--inventory', $argv, true)) {
    echo inventoryFingerprint().PHP_EOL;
    exit(0);
}

if (in_array('--progress', $argv, true)) {
    echo json_encode([
        'productos_efe' => DB::table('producto')->where('fuente_url', 'like', 'https://www.efe.com.pe/%')->count(),
        'inventarios_inicializados' => DB::table('movimientos_almacen')->where('referencia', 'like', 'EFE-INVENTARIO-MENSUAL-%')->count(),
    ], JSON_PRETTY_PRINT).PHP_EOL;
    exit(0);
}

$taxonomy = json_decode(file_get_contents(database_path('seed-data/efe-taxonomy.json')), true, 512, JSON_THROW_ON_ERROR);
$snapshot = storage_path('app/private/efe-imported-catalog.json');
$catalog = json_decode(file_get_contents(is_file($snapshot) ? $snapshot : database_path('seed-data/efe-catalog.json')), true, 512, JSON_THROW_ON_ERROR);
$errors = [];
$check = function (bool $condition, string $message) use (&$errors) { if (!$condition) $errors[] = $message; };
$verifyNode = function (array $node, ?int $parent = null) use (&$verifyNode, $check) {
    $row = DB::table('categoria')->where('fuente_url', $node['url'])->first();
    $check($row && $row->nombre === $node['name'] && $row->categoria_padre_id === $parent && $row->activa, 'Jerarquía incorrecta: '.$node['url']);
    foreach ($node['children'] as $child) $verifyNode($child, $row ? (int) $row->id : null);
};
foreach ($taxonomy['categories'] as $node) $verifyNode($node);
$photos = 0;
$brandNames = DB::table('marca')->pluck('nombre', 'id');
$categoryIds = DB::table('categoria')->pluck('id', 'fuente_url');
$brandKey = static fn (string $name): string => mb_strtolower(Illuminate\Support\Str::ascii($name), 'UTF-8');
$verified = 0;
foreach (array_chunk($catalog, 250) as $chunk) {
    $products = DB::table('producto')->whereIn('fuente_url', array_column($chunk, 'source_url'))->get()->keyBy('fuente_url');
    $ids = $products->pluck('id');
    $variants = DB::table('variante')->whereIn('producto_id', $ids)->get()->keyBy('producto_id');
    $variantIds = $variants->pluck('id');
    $imagesByProduct = DB::table('producto_imagen')->whereIn('producto_id', $ids)->orderBy('orden')->get()->groupBy('producto_id');
    $categoriesByProduct = DB::table('producto_categoria')->whereIn('producto_id', $ids)->get()->groupBy('producto_id');
    $stocks = DB::table('stock_almacen')->whereIn('variante_id', $variantIds)->groupBy('variante_id')->selectRaw('variante_id, SUM(cantidad) as total')->pluck('total', 'variante_id');
    $balances = DB::table('movimientos_almacen')->whereIn('variante_id', $variantIds)->groupBy('variante_id')
        ->selectRaw("variante_id, SUM(CASE WHEN tipo = 'entrada' THEN cantidad WHEN tipo = 'salida' THEN -cantidad ELSE 0 END) as total")->pluck('total', 'variante_id');
foreach ($chunk as $record) {
    $product = $products->get($record['source_url']);
    $check((bool) $product, 'Falta producto: '.$record['source_url']);
    if (!$product) continue;
    $check((bool) $product->activo, 'Producto importado inactivo: '.$product->id);
    $check($product->nombre === $record['name'] && $product->descripcion === $record['description'] && $product->garantias === $record['warranty'], 'Ficha distinta de la fuente: '.$product->id);
    // MySQL's unique brand index treats case and accents as equivalent.
    $check($brandKey((string) $brandNames->get($product->marca_id)) === $brandKey($record['brand']), 'Marca incorrecta: '.$product->id);
    $images = $imagesByProduct->get($product->id, collect())->pluck('url');
    $check($images->unique()->count() >= 3, 'Galería incompleta: '.$product->id);
    $hashes = [];
    foreach ($record['image_paths'] as $path) {
        $file = storage_path('app/public/'.$path);
        $check(is_file($file) && in_array('/storage/'.$path, $images->all(), true), 'Imagen no asociada: '.$path);
        if (is_file($file)) {
            $check(@getimagesize($file) !== false, 'Archivo de imagen no válido: '.$path);
            $hashes[] = hash_file('sha256', $file);
        }
        $photos++;
    }
    $check(count(array_unique($hashes)) >= 3, 'Fotos repetidas: '.$product->id);
    foreach ($record['category_urls'] as $url) {
        $id = $categoryIds->get($url);
        $check($id !== null && $categoriesByProduct->get($product->id, collect())->contains('categoria_id', $id), 'Asociación de categoría ausente: '.$product->id);
    }
    $variant = $variants->get($product->id);
    $check($variant && (float) $variant->precio === (float) $record['price'] && $variant->precio_anterior >= $variant->precio, 'Precio incorrecto: '.$product->id);
    if (!$variant) continue;
    $stock = (int) $stocks->get($variant->id, 0);
    $check($stock === (int) $variant->stock && $stock >= $variant->stock_reservado, 'Stock inconsistente: '.$variant->id);
    $balance = $balances->get($variant->id, 0);
    $check((int) $balance === $stock, 'Kardex inconsistente: '.$variant->id);
}
    $verified += count($chunk);
    if ($verified % 1000 === 0 || $verified === count($catalog)) echo 'Verificados: '.$verified.'/'.count($catalog).PHP_EOL;
}
$service = app(CatalogQueryService::class);
$coverage = json_decode(file_get_contents(database_path('seed-data/efe-coverage.json')), true, 512, JSON_THROW_ON_ERROR);
if ($coverage['leaves_processed'] === $coverage['leaves_total'] && $coverage['products_unique'] === count($catalog)) {
    $check(DB::table('producto')->where('activo', true)->where('sku_base', 'like', 'REAL-%')->count() === count($catalog), 'Quedan productos antiguos activos o falta una ficha importada.');
}
$menu = $service->getCategoryMenu();
$check($menu->count() === count($taxonomy['categories']), 'Número incorrecto de categorías principales.');
$path = $catalog[0]['category_urls'] ?? [];
if ($path) {
    $leafId = DB::table('categoria')->where('fuente_url', end($path))->value('id');
    $response = $service->getCatalogData(['categoria_id' => $leafId]);
    $check($response['productos']['total'] > 0, 'El filtro de tercer nivel no devuelve productos.');
}
if ($errors) { echo implode(PHP_EOL, array_unique($errors)).PHP_EOL; exit(1); }
echo json_encode([
    'categorias_principales' => $menu->count(), 'productos' => count($catalog),
    'fotografias' => $photos, 'validacion' => 'OK',
    'inventario_hash' => inventoryFingerprint(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
