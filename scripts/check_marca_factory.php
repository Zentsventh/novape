<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\Marca;

try {
    $instance = Marca::factory()->make();
    var_dump($instance);
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage();
}
?>
