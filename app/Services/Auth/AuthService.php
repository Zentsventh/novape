<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AuthService
{
    /**
     * @param array<string, mixed> $data
     */
    public function registerUser(array $data): Usuario
    {
        return DB::transaction(function () use ($data) {
            $usuario = Usuario::create([
                'nombres' => $data['nombres'],
                'apellidos' => $data['apellidos'],
                'tipo_documento' => $data['tipo_documento'],
                'dni' => $data['dni'],
                'email' => $data['email'],
                'telefono' => $data['telefono'] ?? null,
                'password_hash' => Hash::make($data['password']),
                'estado' => 'activo'
            ]);

            $rolCliente = Rol::where('nombre', 'cliente')->first();
            $usuario->forceFill(['custom_fields' => ['store_consent' => [
                'terms_accepted_at' => now()->toIso8601String(),
                'promotions' => (bool) ($data['acepta_promociones'] ?? false),
                'loyalty_program' => (bool) ($data['acepta_programa'] ?? false),
            ]]])->save();
            if ($rolCliente) {
                $usuario->roles()->attach($rolCliente->id);
            }

            return $usuario;
        });
    }
}
