<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Domain\Dashboard\Services\DashboardService;
use App\Domain\Catalog\Products\Services\ProductService;
use App\Domain\Search\Services\SearchService;
use App\Domain\Automation\Listeners\AutomationListener;

// Sales domain imports
use App\Domain\Sales\Repositories\OrderRepositoryInterface;
use App\Domain\Sales\Repositories\OrderItemRepositoryInterface;
use App\Domain\Sales\Repositories\CartRepositoryInterface;
use App\Domain\Sales\Repositories\EloquentOrderRepository;
use App\Domain\Sales\Repositories\EloquentOrderItemRepository;
use App\Domain\Sales\Repositories\EloquentCartRepository;
use App\Domain\Sales\Services\OrderService;
use App\Domain\Sales\Services\CartService;

class DomainServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register()
    {
        // Bind domain services as singletons so they can be injected anywhere
        $this->app->singleton(DashboardService::class, function ($app) {
            return new DashboardService();
        });

        $this->app->singleton(ProductService::class, function ($app) {
            return new ProductService();
        });

        $this->app->singleton(SearchService::class, function ($app) {
            return new SearchService();
        });

        // Automation listener is auto‑registered via EventServiceProvider but we bind it here too
        $this->app->singleton(AutomationListener::class, function ($app) {
            return new AutomationListener();
        });

        // Sales domain bindings
        $this->app->singleton(OrderRepositoryInterface::class, function ($app) {
            return new EloquentOrderRepository();
        });
        $this->app->singleton(OrderItemRepositoryInterface::class, function ($app) {
            return new EloquentOrderItemRepository();
        });
        $this->app->singleton(CartRepositoryInterface::class, function ($app) {
            return new EloquentCartRepository();
        });
        $this->app->singleton(OrderService::class, function ($app) {
            return new OrderService(
                $app->make(OrderRepositoryInterface::class),
                $app->make(OrderItemRepositoryInterface::class)
            );
        });
        $this->app->singleton(CartService::class, function ($app) {
            return new CartService(
                $app->make(CartRepositoryInterface::class),
                $app->make(OrderRepositoryInterface::class),
                $app->make(OrderItemRepositoryInterface::class)
            );
        });
        // Inventory domain bindings
        $this->app->singleton(\App\Domain\Inventory\Repositories\StockRepositoryInterface::class, function ($app) {
            return new \App\Domain\Inventory\Repositories\EloquentStockRepository();
        });
        $this->app->singleton(\App\Domain\Inventory\Repositories\WarehouseRepositoryInterface::class, function ($app) {
            return new \App\Domain\Inventory\Repositories\EloquentWarehouseRepository();
        });
        $this->app->singleton(\App\Domain\Inventory\Services\StockService::class, function ($app) {
            return new \App\Domain\Inventory\Services\StockService($app->make(\App\Domain\Inventory\Repositories\StockRepositoryInterface::class));
        });
        $this->app->singleton(\App\Domain\Inventory\Services\WarehouseService::class, function ($app) {
            return new \App\Domain\Inventory\Services\WarehouseService($app->make(\App\Domain\Inventory\Repositories\WarehouseRepositoryInterface::class));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot()
    {
        // Nothing required for now – policies are auto‑discovered via AuthServiceProvider
    }
}
