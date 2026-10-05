<?php
namespace App\Policies;

use App\Domain\Inventory\Entities\Warehouse;
use App\Models\User;

class WarehousePolicy
{
    public function view(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo('inventory.warehouse.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventory.warehouse.create');
    }

    public function update(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo('inventory.warehouse.edit');
    }

    public function delete(User $user, Warehouse $warehouse): bool
    {
        return $user->hasPermissionTo('inventory.warehouse.delete');
    }
}
?>
