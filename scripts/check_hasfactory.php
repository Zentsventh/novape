<?php
require __DIR__ . '/../vendor/autoload.php';

use App\Models\Marca;

if (method_exists(Marca::class, 'factory')) {
    echo "factory method exists\n";
} else {
    echo "factory method NOT found\n";
}
?>

