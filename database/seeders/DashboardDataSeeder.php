<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Producto;

class DashboardDataSeeder extends Seeder
{
    public function run(): void
    {
        // Hacer que algunos productos tengan stock bajo (menor o igual a 10)
        $productosStockBajo = Producto::inRandomOrder()->take(5)->get();
        foreach ($productosStockBajo as $producto) {
            $producto->variantes()->update(['stock' => rand(1, 5)]);
            // El modelo Producto podría no tener campo stock, sino variante, o quizás ambos.
            // Si el stock general de producto existe, lo actualizamos también.
            try {
                $producto->update(['stock' => rand(1, 5)]);
            } catch (\Exception $e) {}
        }
    }
}
