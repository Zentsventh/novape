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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Prevent N+1 issues by throwing an exception if lazy loading happens outside production
        Model::preventLazyLoading(! $this->app->isProduction());

        Pedido::observe(PedidoObserver::class);

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
