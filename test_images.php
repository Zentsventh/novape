<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$images = App\Models\ProductoImagen::take(10)->get();
foreach($images as $img) {
    echo $img->id . ' : ' . $img->getRawOriginal('url') . ' | Product ID: ' . $img->producto_id . "\n";
}
