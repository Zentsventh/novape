<?php

namespace Database\Factories;

use App\Models\Pedido;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pedido>
 */
class PedidoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'codigo' => $this->faker->unique()->bothify('PED-####-????'),
            'subtotal' => 100,
            'descuento' => 0,
            'costo_envio' => 10,
            'total' => 110,
            'estado' => 'Pendiente',
            'tipo_comprobante' => 'ticket',
        ];
    }
}
