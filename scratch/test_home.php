<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$srv = new App\Services\Catalog\CatalogQueryService();
$data = $srv->getHomeData();
foreach ($data['categoriaProductos'] as $cat) {
    echo $cat['nombre'] . ": " . count($cat['productos']) . " productos\n";
    if (count($cat['productos']) > 0) {
        $p = $cat['productos']->first();
        echo "  - " . $p->nombre . " | Img: " . $p->imagen . " | Precio: " . $p->precio_actual . "\n";
    }
}
echo "\nMejor semana: " . count($data['mejorSemana']) . "\n";
if (count($data['mejorSemana']) > 0) {
    $p = $data['mejorSemana']->first();
    echo "  - " . $p->nombre . " | Img: " . $p->imagen . " | Precio: " . $p->precio_actual . "\n";
}
