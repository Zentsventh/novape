<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Pedido;
use App\Observers\PedidoObserver;
use AzureOss\Storage\Blob\BlobServiceClient;
use AzureOss\Storage\BlobFlysystem\AzureBlobStorageAdapter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(\App\Services\Storefront\VariantPricing::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $caBundle = config('http.ca_bundle');
        if ($caBundle && is_file($caBundle)) {
            \Illuminate\Support\Facades\Http::globalOptions(['verify'=>$caBundle]);
        }
        foreach (['panel-assistant' => 15, 'team-workspace' => 1200, 'team-create' => 20, 'team-send' => 60, 'team-presence' => 120, 'team-signal' => 900, 'inbox-send' => 30] as $name => $maximum) {
            \Illuminate\Support\Facades\RateLimiter::for($name, fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute($maximum)
                ->by($name.':'.(auth('admin')->id() ?? $request->ip())));
        }
        // Prevent N+1 issues by throwing an exception if lazy loading happens outside production
        Model::preventLazyLoading(! $this->app->isProduction());

        Pedido::observe(PedidoObserver::class);

        \Illuminate\Support\Facades\Queue::looping(function (\Illuminate\Queue\Events\Looping $event) {
            request()->attributes->remove('site_settings_snapshot');
            try {
                foreach (explode(',', $event->queue) as $queue) {
                    \Illuminate\Support\Facades\Cache::put(
                        \App\Services\Admin\Operations\PanelHealthService::workerKey($event->connectionName, trim($queue)),
                        now()->timestamp,
                        600
                    );
                }
            } catch (\Throwable $e) {
                report($e);
            }
        });

        Storage::extend('azure', function ($app, $config) {
            $client = ! empty($config['connection_string'])
                ? BlobServiceClient::fromConnectionString($config['connection_string'])
                : BlobServiceClient::fromConnectionString(
                    sprintf(
                        'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net',
                        (string) ($config['name'] ?? ''),
                        (string) ($config['key'] ?? '')
                    )
                );

            $containerClient = $client->getContainerClient((string) ($config['container'] ?? 'novape-uploads'));
            $adapter = new AzureBlobStorageAdapter(
                containerClient: $containerClient,
                prefix: (string) ($config['prefix'] ?? ''),
                isPublicContainer: (bool) ($config['is_public'] ?? true)
            );

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
