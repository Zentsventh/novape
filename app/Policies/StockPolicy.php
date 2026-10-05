<?php
namespace App\Policies;

use App\Domain\Inventory\Entities\Stock;
use App\Models\User;

class StockPolicy
{
    public function view(User $user, Stock $stock): bool
    {
        return $user->hasPermissionTo('inventory.stock.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('inventory.stock.create');
    }

    public function update(User $user, Stock $stock): bool
    {
        return $user->hasPermissionTo('inventory.stock.edit');
    }

    public function delete(User $user, Stock $stock): bool
    {
        return $user->hasPermissionTo('inventory.stock.delete');
    }
}
?>
