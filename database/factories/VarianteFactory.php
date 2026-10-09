<?php

namespace Database\Factories;

use App\Models\Variante;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Variante>
 */
class VarianteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sku' => $this->faker->unique()->bothify('VAR-####-????'),
            'precio' => $this->faker->randomFloat(2, 10, 1000),
            'stock' => $this->faker->numberBetween(10, 100),
            'stock_reservado' => 0,
        ];
    }
}
