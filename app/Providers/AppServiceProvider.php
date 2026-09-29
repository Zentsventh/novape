<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Model;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Prevent N+1 issues by throwing an exception if lazy loading happens outside production
        Model::preventLazyLoading(!$this->app->isProduction());

        if ($this->app->environment('local') && $this->app->runningInConsole()) {
            \Illuminate\Support\Facades\Event::listen(\Illuminate\Console\Events\CommandStarting::class, function (\Illuminate\Console\Events\CommandStarting $event) {
                if ($event->command === 'serve') {
                    $hotPath = public_path('hot');
                    if (file_exists($hotPath)) {
                        @unlink($hotPath);
                    }
                }
            });
        }

        \App\Models\Pedido::observe(\App\Observers\PedidoObserver::class);

        \Illuminate\Support\Facades\Storage::extend('azure', function ($app, $config) {
            $client = !empty($config['connection_string'])
                ? \AzureOss\Storage\Blob\BlobServiceClient::fromConnectionString($config['connection_string'])
                : \AzureOss\Storage\Blob\BlobServiceClient::fromConnectionString(
                    sprintf(
                        'DefaultEndpointsProtocol=https;AccountName=%s;AccountKey=%s;EndpointSuffix=core.windows.net',
                        (string) ($config['name'] ?? ''),
                        (string) ($config['key'] ?? '')
                    )
                );

            $containerClient = $client->getContainerClient((string) ($config['container'] ?? 'novape-uploads'));
            $adapter = new \AzureOss\Storage\BlobFlysystem\AzureBlobStorageAdapter(
                containerClient: $containerClient,
                prefix: (string) ($config['prefix'] ?? ''),
                isPublicContainer: (bool) ($config['is_public'] ?? true)
            );

            return new \Illuminate\Filesystem\FilesystemAdapter(
                new \League\Flysystem\Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
