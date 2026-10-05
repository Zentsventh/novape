<?php
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Database\Seeders\RealStoreMonthSeeder;
use Illuminate\Support\Facades\DB;

$batch = RealStoreMonthSeeder::BATCH;
$errors = [];
$check = function (bool $condition, string $message) use (&$errors) {
    if (!$condition) $errors[] = $message;
};
$users = DB::table('usuario')->where('seed_batch', $batch)->whereNotNull('dni')->get();
$check($users->count() === 200, 'Se requieren 200 clientes del lote.');
$check($users->pluck('dni')->unique()->count() === 200, 'DNI repetidos.');
foreach ($users as $user) {
    $check((bool) preg_match('/^\d{8}$/', $user->dni), 'Formato de DNI incorrecto.');
    $check((bool) preg_match('/^[a-z.]+\d{3}@example\.test$/', $user->email), 'Formato de correo incorrecto.');
}
$products = DB::table('producto')->where('sku_base', 'like', 'REAL-%')->get();
$efeCatalog = DB::table('categoria')->whereNotNull('fuente_url')->exists();
$check($efeCatalog ? $products->count() >= 129 : $products->count() === 129, 'Faltan productos del catálogo inicial.');
$categoryCounts = DB::table('producto_categoria')->join('producto', 'producto.id', '=', 'producto_categoria.producto_id')
    ->join('categoria', 'categoria.id', '=', 'producto_categoria.categoria_id')->whereNull('categoria.categoria_padre_id')
    ->where('producto.sku_base', 'like', 'REAL-%')->groupBy('categoria_id')->selectRaw('categoria_id, COUNT(*) AS n')->get();
if (!$efeCatalog) $check($categoryCounts->count() === 13 && $categoryCounts->every(fn ($c) => $c->n == 10), 'Cada una de las 13 categorías debe tener diez productos.');
foreach (DB::table('producto_imagen')->whereIn('producto_id', $products->pluck('id'))->get() as $image) {
    $path = storage_path('app/public/'.substr($image->url, strlen('/storage/')));
    $check(is_file($path) && @getimagesize($path) !== false, 'Imagen ausente o inválida.');
}
$variants = DB::table('variante')->where('sku', 'like', 'REAL-%')->get();
foreach ($variants as $variant) {
    $check($efeCatalog ? $variant->stock >= $variant->stock_reservado : $variant->stock >= 100 && $variant->stock <= 200, 'Stock fuera de rango.');
    $check($variant->precio > 0 && $variant->precio_anterior >= $variant->precio, 'Precio/descuento inválido.');
    $warehouseStock = DB::table('stock_almacen')->where('variante_id', $variant->id)->sum('cantidad');
    $entries = DB::table('movimientos_almacen')->where('variante_id', $variant->id)->where('tipo', 'entrada')->sum('cantidad');
    $exits = DB::table('movimientos_almacen')->where('variante_id', $variant->id)->where('tipo', 'salida')->sum('cantidad');
    $check((int) $warehouseStock === $variant->stock && (int) ($entries - $exits) === $variant->stock, 'Stock y kardex no coinciden.');
}
$orders = DB::table('pedido')->where('seed_batch', $batch)->get();
$check($orders->count() === 90, 'Se requieren 90 pedidos web.');
$check($orders->pluck('estado')->unique()->count() === 5, 'Faltan estados de pedidos.');
$check($orders->map(fn ($o) => substr($o->created_at, 0, 10))->unique()->count() === 30, 'Faltan días del mes.');
foreach ($orders as $order) {
    $sum = DB::table('pedido_item')->where('pedido_id', $order->id)->selectRaw('SUM(cantidad * precio_unitario) AS total')->value('total');
    $check(abs($sum - $order->subtotal) < 0.011 && abs($order->subtotal - $order->descuento + $order->costo_envio - $order->total) < 0.011, 'Total de pedido inconsistente.');
    $check(DB::table('pago')->where('pedido_id', $order->id)->count() === 1, 'Falta pago o está duplicado.');
    $check(DB::table('envio')->where('pedido_id', $order->id)->count() === 1, 'Falta envío o está duplicado.');
    $check(!$order->facturado_sunat, 'Un pedido simulado figura como emitido a SUNAT.');
}
$pos = DB::table('ventas_pos')->where('seed_batch', $batch)->get();
$check($pos->count() === 60, 'Se requieren 60 ventas POS.');
foreach ($pos as $sale) {
    $items = DB::table('venta_pos_items')->where('venta_pos_id', $sale->id)->sum('subtotal');
    $payments = DB::table('venta_pos_pagos')->where('venta_pos_id', $sale->id)->sum('monto');
    $check(abs($items - $sale->total) < 0.011 && abs($payments - $sale->total) < 0.011 && abs($sale->subtotal + $sale->igv - $sale->total) < 0.011, 'Venta POS inconsistente.');
}
foreach (DB::table('compras')->where('seed_batch', $batch)->get() as $purchase) {
    $check(abs(DB::table('compra_items')->where('compra_id', $purchase->id)->sum('subtotal') - $purchase->total) < 0.011, 'Total de compra inconsistente.');
}
$start = $orders->min('created_at');
$end = $orders->max('created_at');
$stats = app(App\Services\Admin\Dashboard\AnalyticsService::class)->getDashboardStats(substr($start, 0, 10), substr($end, 0, 10), 'created_at', 'desc');
$crm = app(App\Services\CrmAnalyticsService::class)->getDashboardMetrics();
$catalog = app(App\Services\Catalog\CatalogQueryService::class)->getHomeData();
$inventory = app(App\Services\Admin\Warehouse\InventoryAuditService::class)->getDashboardData();
$check($stats['ventasTotal'] > 0 && $stats['costosTotal'] > 0 && count($stats['topProductosVendidos']) > 0, 'Dashboard general incompleto.');
$check($crm['kpis']['total_deals'] >= 30 && count($crm['funnel']) >= 6, 'Dashboard CRM incompleto.');
$check(count($catalog) > 0, 'Catálogo vacío.');
$check(count($inventory['productos']) >= 129 && count($inventory['demandaRaw']) > 0, 'Dashboard de inventario incompleto.');
$check(count($crm['leaderboard']) > 0, 'Ranking CRM sin actividad.');
foreach ($catalog['categoriaProductos'] as $category) {
    if (!$efeCatalog) $check(count($category['subcategorias']) > 0 && count($category['marcas']) > 0, 'Categoría sin navegación: '.$category['nombre']);
}
$check(count($catalog['banners']) === 5, 'Se requieren cinco banners activos.');
foreach ($catalog['banners'] as $banner) {
    foreach ([$banner->imagen_url, $banner->imagen_mobile_url] as $image) {
        $check(is_file(storage_path('app/public/'.substr($image, strlen('/storage/')))), 'Falta una imagen de banner.');
    }
}
if ($errors) {
    echo implode(PHP_EOL, array_unique($errors)).PHP_EOL;
    exit(1);
}
echo json_encode(['clientes' => $users->count(), 'productos' => $products->count(), 'categorias' => $categoryCounts->count(),
    'pedidos_web' => $orders->count(), 'ventas_pos' => $pos->count(), 'desde' => substr($start, 0, 10), 'hasta' => substr($end, 0, 10),
    'estados' => $orders->groupBy('estado')->map->count(), 'ventas_PEN' => $stats['ventasTotal'], 'costos_PEN' => $stats['costosTotal'],
    'ganancia_PEN' => round($stats['gananciaNeta'], 2), 'crm' => $crm['kpis'], 'validacion' => 'OK'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
