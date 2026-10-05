<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Producto;
use App\Policies\ProductPolicy;
use App\Domain\Inventory\Entities\Warehouse;
use App\Domain\Inventory\Entities\Stock;
use App\Policies\WarehousePolicy;
use App\Policies\StockPolicy;

// Sales domain imports
use App\Domain\Sales\Entities\Order;
use App\Domain\Sales\Entities\Cart;
use App\Policies\OrderPolicy;
use App\Policies\CartPolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Producto::class => ProductPolicy::class,
        Warehouse::class => WarehousePolicy::class,
    Stock::class => StockPolicy::class,
];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
?>
