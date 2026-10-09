<?php

namespace App\Policies;

use App\Models\DireccionUsuario;
use App\Models\Usuario;
use Illuminate\Auth\Access\Response;

class DireccionPolicy
{
    public function update(Usuario $user, DireccionUsuario $direccion): bool
    {
        return $user->id === $direccion->usuario_id;
    }

    public function delete(Usuario $user, DireccionUsuario $direccion): bool
    {
        return $user->id === $direccion->usuario_id;
    }
}
