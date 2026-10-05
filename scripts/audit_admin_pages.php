<?php

use App\Models\Usuario;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

// Read-only route smoke audit. Never submits sales, messages or external requests.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();
config(['inertia.devtools.enabled' => false, 'session.driver' => 'array', 'cache.default' => 'array']);
// The audit runs over 60 reads in one process; exclude only rate limits here.
foreach ($app->make('router')->getRoutes() as $route) {
    $route->withoutMiddleware(array_values(array_filter($route->gatherMiddleware(),
        fn ($middleware) => is_string($middleware) && str_starts_with($middleware, 'throttle:'))));
}
$user = Usuario::where('estado', 'activo')->whereHas('roles', fn ($q) => $q->where('nombre', 'admin'))->firstOrFail();
$paths = ['/admin', '/admin?estado=pendiente', '/admin?q=cliente', '/admin/analiticas', '/admin/products', '/admin/products/create', '/admin/categorias', '/admin/categorias/create', '/admin/marcas', '/admin/pedidos', '/admin/clientes', '/admin/clientes/create', '/admin/trabajadores', '/admin/trabajadores/create', '/admin/roles', '/admin/roles/create', '/admin/ajustes', '/admin/ajustes/permisos', '/admin/almacenes', '/admin/inventario', '/admin/compras', '/admin/proveedores', '/admin/gastos', '/admin/pos', '/admin/pos/historial', '/admin/zonas', '/admin/metodos-pago', '/admin/banners', '/admin/cupones', '/admin/audit-logs', '/admin/notificaciones', '/admin/clientes/importar', '/admin/crm/dashboard', '/admin/crm/pipeline', '/admin/crm/tasks', '/admin/crm/cases', '/admin/crm/calendar', '/admin/crm/companies', '/admin/crm/settings/objects', '/admin/crm/custom-fields', '/admin/crm/automations', '/admin/rma', '/admin/marketing/campaigns', '/admin/marketing/campaigns/create', '/admin/inbox'];
$results = [];
foreach ([
    'producto' => ['/admin/products/%d', '/admin/products/%d/edit'],
    'pedido' => ['/admin/pedidos/%d'],
    'usuario' => ['/admin/clientes/%d', '/admin/clientes/%d/edit', '/admin/trabajadores/%d', '/admin/trabajadores/%d/edit'],
    'categoria' => ['/admin/categorias/%d/edit'],
    'marca' => ['/admin/marcas/%d/edit'],
    'rol' => ['/admin/roles/%d/edit'],
    'compras' => ['/admin/compras/%d'],
    'almacenes' => ['/admin/almacenes/%d/kardex'],
    'crm_deals' => ['/admin/crm/deals/%d'],
    'crm_companies' => ['/admin/crm/companies/%d'],
    'crm_cases' => ['/admin/crm/cases/%d'],
    'rma_requests' => ['/admin/rma/%d'],
    'cupones' => ['/admin/cupones/%d/edit'],
    'proveedor' => ['/admin/proveedores/%d', '/admin/proveedores/%d/edit'],
] as $table => $patterns) {
    $id = DB::table($table)->min('id');
    if ($id) {
        foreach ($patterns as $pattern) {
            $paths[] = sprintf($pattern, $id);
        }
    }
}
$paths[] = '/admin?status=pendiente';
$paths[] = '/admin/cupones/create';
$paths[] = '/admin/buscar?q=cliente';
$paths[] = '/admin/crm/search?q=cliente';
$paths[] = '/admin/pedidos/exportar-pdf';
$paths[] = '/admin/pedidos/exportar-excel';
$paths = array_merge($paths, ['/admin/products/exportar', '/admin/clientes/exportar', '/admin/trabajadores/exportar', '/admin/pedidos/exportar', '/admin/crm/export?type=companies', '/admin/crm/export?type=deals', '/admin/crm/export?type=personas']);
foreach ($paths as $path) {
    $request = Request::create($path, 'GET', server: ['HTTP_ACCEPT' => 'text/html', 'HTTP_HOST' => '127.0.0.1:8000']);
    $app->instance('request', $request);
    Auth::guard('admin')->setUser($user);
    $started = microtime(true);
    try {
        $response = $kernel->handle($request);
        $row = ['path' => $path, 'status' => $response->getStatusCode(), 'ms' => (int) ((microtime(true) - $started) * 1000)];
        if ($response instanceof StreamedResponse) {
            ob_start();
            try {
                $response->sendContent();
                $row['bytes'] = ob_get_length();
            } finally {
                ob_end_clean();
            }
        }
        $exception = $request->attributes->get('exception');
        if ($exception) {
            $row['error'] = $exception->getMessage();
        }
    } catch (Throwable $e) {
        $row = ['path' => $path, 'status' => 500, 'error' => $e->getMessage()];
    }
    $results[] = $row;
    echo json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES).PHP_EOL;
    unset($response, $request);
    gc_collect_cycles();
}
file_put_contents(__DIR__.'/../storage/logs/admin-pages-audit.json', json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
exit(count(array_filter($results, fn ($row) => $row['status'] >= 400)) ? 1 : 0);
