<?php

namespace Database\Factories;

use App\Models\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Producto>
 */
class ProductoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre' => $this->faker->words(3, true),
            'slug' => $this->faker->slug(),
            'descripcion' => $this->faker->sentence(),
            'marca_id' => null,
            'proveedor_id' => null,
            'activo' => 1,
            'tipo_afectacion_igv' => '10',
            'sku_base' => $this->faker->unique()->bothify('SKU-####-????'),
        ];
    }
}
