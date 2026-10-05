<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domain\Inventory\Entities\Stock;
use App\Domain\Inventory\Entities\Warehouse;
use App\Domain\Sales\Entities\Cart;
use App\Domain\Sales\Entities\Order;
use App\Models\Producto;
use App\Policies\CartPolicy;
use App\Policies\OrderPolicy;
// Sales domain imports
use App\Policies\ProductPolicy;
use App\Policies\StockPolicy;
use App\Policies\WarehousePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

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
        Order::class => OrderPolicy::class,
        Cart::class => CartPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
