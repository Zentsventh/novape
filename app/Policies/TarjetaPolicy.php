<?php

namespace App\Policies;

use App\Models\UsuarioTarjeta;
use App\Models\Usuario;
use Illuminate\Auth\Access\Response;

class TarjetaPolicy
{
    public function delete(Usuario $user, UsuarioTarjeta $tarjeta): bool
    {
        return $user->id === $tarjeta->usuario_id;
    }
    public function view(Usuario $user, UsuarioTarjeta $tarjeta): bool
    {
        return $user->id === $tarjeta->usuario_id;
    }

    public function update(Usuario $user, UsuarioTarjeta $tarjeta): bool
    {
        return $user->id === $tarjeta->usuario_id;
    }
}
