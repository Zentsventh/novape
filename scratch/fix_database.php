<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Pedido;
use App\Models\VentaPos;
use App\Models\Rma;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "Asignando productos a categorias vacias...\n";

// Get categories that might be empty
$emptyCats = Categoria::whereIn('nombre', ['Mundo Gamer', 'Audio', 'TV', 'Smartwatches'])->get();
$allProducts = Producto::take(20)->get();

if ($allProducts->count() > 0) {
    foreach ($emptyCats as $cat) {
        // Sync 5 random products to this category
        $cat->productos()->syncWithoutDetaching($allProducts->random(5)->pluck('id')->toArray());
        echo "Asignados productos a " . $cat->nombre . "\n";
    }
}

echo "Generando datos de Analytics...\n";

DB::statement('SET FOREIGN_KEY_CHECKS=0;');

// Generate Analytics Data
for ($i = 0; $i < 30; $i++) {
    $date = Carbon::now()->subDays(rand(0, 30));
    
    // Web Orders
    Pedido::create([
        'usuario_id' => 1,
        'estado' => collect(['completado', 'pendiente', 'enviado'])->random(),
        'subtotal' => rand(100, 1000),
        'total' => rand(118, 1180),
        'codigo' => 'ORD-' . rand(1000, 9999) . '-' . $i,
        'created_at' => $date,
        'updated_at' => $date,
    ]);

    // POS Sales
    VentaPos::create([
        'cajero_id' => 1,
        'cliente_id' => null,
        'codigo_ticket' => 'TK-' . rand(1000, 9999) . '-' . $i,
        'total' => rand(200, 2000),
        'created_at' => $date,
        'updated_at' => $date,
    ]);
}

// RMA
for ($i = 0; $i < 10; $i++) {
    $date = Carbon::now()->subDays(rand(0, 30));
    Rma::create([
        'pedido_item_id' => \App\Models\PedidoItem::inRandomOrder()->first()->id ?? 1,
        'estado' => collect(['pendiente', 'aprobado', 'rechazado', 'resuelto'])->random(),
        'motivo' => 'Garantia',
        'created_at' => $date,
        'updated_at' => $date,
    ]);
}

echo "Datos generados exitosamente.\n";
