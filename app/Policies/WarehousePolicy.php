<?php

namespace App\Policies;

use App\Domain\Inventory\Entities\Warehouse;
use App\Models\Usuario;

class WarehousePolicy
{
    public function view(Usuario $user, Warehouse $warehouse): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }

    public function create(Usuario $user): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }

    public function update(Usuario $user, Warehouse $warehouse): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }

    public function delete(Usuario $user, Warehouse $warehouse): bool
    {
        return $user->estado === 'activo' && $user->tienePermiso('inventario.gestionar');
    }
}
