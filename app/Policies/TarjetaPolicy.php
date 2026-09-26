<?php

namespace App\Policies;

use App\Models\Tarjeta;
use App\Models\Usuario;
use Illuminate\Auth\Access\Response;

class TarjetaPolicy
{
    public function delete(Usuario $user, Tarjeta $tarjeta): bool
    {
        return $user->id === $tarjeta->usuario_id;
    }
    public function view(Usuario $user, Tarjeta $tarjeta): bool
    {
        return $user->id === $tarjeta->usuario_id;
    }

    public function update(Usuario $user, Tarjeta $tarjeta): bool
    {
        return $user->id === $tarjeta->usuario_id;
    }
}
