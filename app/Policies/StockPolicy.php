<?php

namespace App\Policies;

use App\Domain\Inventory\Entities\Stock;
use App\Models\Usuario;

class StockPolicy
{
    public function view(Usuario $user, Stock $stock): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }

    public function create(Usuario $user): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }

    public function update(Usuario $user, Stock $stock): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }

    public function delete(Usuario $user, Stock $stock): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }
}
