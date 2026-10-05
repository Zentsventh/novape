<?php
ini_set('memory_limit', '-1');
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ProductoImagen;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

$baseDir = storage_path('app/public/productos');
$files = File::allFiles($baseDir);

$countMoved = 0;
$countNotFound = 0;

foreach ($files as $file) {
    $filename = $file->getFilename();
    
    // Check if it ends with _resultado.webp
    if (Str::endsWith($filename, '_resultado.webp')) {
        // Extract original hash, e.g. from 37694804de8af80f760e98c9_resultado.webp
        $originalHash = str_replace('_resultado.webp', '', $filename);
        
        // Find in database
        $imagen = ProductoImagen::where('url', 'LIKE', "%/{$originalHash}.%")->first();
        
        if ($imagen) {
            $producto = $imagen->producto;
            if ($producto) {
                $categoria = $producto->categorias()->first();
                $categoriaNombre = $categoria ? $categoria->nombre : 'Sin Categoria';
                $categoriaSlug = Str::slug($categoriaNombre);
                
                $newDir = $baseDir . DIRECTORY_SEPARATOR . $categoriaSlug;
                if (!File::exists($newDir)) {
                    File::makeDirectory($newDir, 0755, true);
                }
                
                $newFilePath = $newDir . DIRECTORY_SEPARATOR . $filename;
                
                // Move file
                File::move($file->getRealPath(), $newFilePath);
                
                // Update database
                $newUrl = '/storage/productos/' . $categoriaSlug . '/' . $filename;
                $imagen->url = $newUrl;
                $imagen->save();
                
                $countMoved++;
            } else {
                echo "Producto no encontrado para imagen: $filename\n";
                $countNotFound++;
            }
        } else {
            // Also check if the url already has the _resultado.webp in case script was run partially
            $imagenAlready = ProductoImagen::where('url', 'LIKE', "%/{$originalHash}_resultado.webp")->first();
            if ($imagenAlready) {
                // Already updated in DB, maybe just check if we need to move it
                $producto = $imagenAlready->producto;
                $categoria = $producto ? $producto->categorias()->first() : null;
                $categoriaSlug = $categoria ? Str::slug($categoria->nombre) : 'sin-categoria';
                
                $newDir = $baseDir . DIRECTORY_SEPARATOR . $categoriaSlug;
                if (!File::exists($newDir)) {
                    File::makeDirectory($newDir, 0755, true);
                }
                
                if ($file->getPath() !== $newDir) {
                    $newFilePath = $newDir . DIRECTORY_SEPARATOR . $filename;
                    File::move($file->getRealPath(), $newFilePath);
                    $newUrl = '/storage/productos/' . $categoriaSlug . '/' . $filename;
                    $imagenAlready->url = $newUrl;
                    $imagenAlready->save();
                    $countMoved++;
                }
            } else {
                echo "Imagen no encontrada en BD para hash: $originalHash\n";
                $countNotFound++;
            }
        }
    }
}

echo "Proceso terminado. Movidos/Actualizados: $countMoved. No encontrados: $countNotFound\n";

// Attempt to clean up empty directories in productos
$directories = File::directories($baseDir);
foreach ($directories as $dir) {
    if (count(File::allFiles($dir)) === 0) {
        File::deleteDirectory($dir);
        echo "Directorio vacio eliminado: " . basename($dir) . "\n";
    }
}
