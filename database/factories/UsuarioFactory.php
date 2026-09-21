<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Usuario>
 */
class UsuarioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombres' => $this->faker->firstName(),
            'apellidos' => $this->faker->lastName(),
            'email' => $this->faker->unique()->safeEmail(),
            'password_hash' => bcrypt('password'),
            'tipo_documento' => 'DNI',
            'dni' => $this->faker->unique()->numerify('########'),
            'telefono' => $this->faker->phoneNumber(),
            'estado' => 1,
            'has_set_password' => true,
        ];
    }
}
