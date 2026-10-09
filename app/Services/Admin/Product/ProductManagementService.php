<?php

declare(strict_types=1);

namespace App\Services\Admin\Product;

use App\Models\Categoria;
use App\Models\ConfiguracionSitio;
use App\Models\Producto;
use App\Models\ProductoEspecificacion;
use App\Models\ProductoImagen;
use App\Models\Variante;
use App\Services\Inventory\StockAvailability;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductManagementService
{
    public function __construct(
        private readonly ImageUploadService $imageUploadService
    ) {}

    public function createProduct(array $data, int $userId): Producto
    {
        return DB::transaction(function () use ($data, $userId) {
            $data['sku_base'] = ($data['sku_base'] ?? null) ?: 'NP-'.strtoupper((string) \Illuminate\Support\Str::ulid());
            $producto = Producto::create([
                'nombre' => $data['nombre'],
                'marca_id' => $data['marca_id'],
                'proveedor_id' => $data['proveedor_id'] ?? null,
                'sku_base' => $data['sku_base'],
                'descripcion' => $data['descripcion'] ?? null,
                'garantias' => $data['garantias'] ?? null,
                'activo' => $data['activo'] ?? true,
                'retiro_tienda' => $data['retiro_tienda'] ?? true,
                'envio_domicilio' => $data['envio_domicilio'] ?? true,
            ]);

            $variante = Variante::create([
                'producto_id' => $producto->id,
                'sku' => $data['sku_base'] ?? ('SKU-'.$producto->id),
                'precio' => $data['precio'],
                'peso' => $data['peso_kg'] ?? 1.0,
                'shipping_length_cm' => $data['shipping_length_cm'] ?? null,
                'shipping_width_cm' => $data['shipping_width_cm'] ?? null,
                'shipping_height_cm' => $data['shipping_height_cm'] ?? null,
                'stock' => 0,
                'activo' => true,
            ]);

            $this->adjustStock($variante, (int) $data['stock'], 'Ajuste inicial al crear producto', $userId);
            $this->syncCategories($producto, $data['categorias'] ?? []);
            $this->processImages($producto, $data['imagenes'] ?? []);
            $this->syncSpecifications($producto, $data['especificaciones'] ?? []);

            return $producto;
        });
    }

    public function updateProduct(Producto $producto, array $data, int $userId): Producto
    {
        return DB::transaction(function () use ($producto, $data, $userId) {
            $data['sku_base'] = ($data['sku_base'] ?? null) ?: $producto->sku_base;
            $producto->update([
                'nombre' => $data['nombre'],
                'marca_id' => $data['marca_id'],
                'proveedor_id' => $data['proveedor_id'] ?? null,
                'sku_base' => $data['sku_base'],
                'descripcion' => $data['descripcion'] ?? null,
                'garantias' => $data['garantias'] ?? null,
                'activo' => $data['activo'] ?? true,
                'retiro_tienda' => $data['retiro_tienda'] ?? true,
                'envio_domicilio' => $data['envio_domicilio'] ?? true,
            ]);

            $variante = Variante::where('producto_id', $producto->id)->lockForUpdate()->first();
            $nuevoStock = (int) $data['stock'];
            $diferencia = 0;

            if ($variante) {
                $localStock = (int) DB::table('stock_almacen')->where('variante_id', $variante->id)
                    ->where('almacen_id', (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1))->value('cantidad');
                $diferencia = $nuevoStock - $localStock;
                $variante->update([
                    'sku' => $data['sku_base'] ?? $variante->sku,
                    'precio' => $data['precio'],
                    'peso' => $data['peso_kg'] ?? 1.0,
                'shipping_length_cm' => array_key_exists('shipping_length_cm', $data) ? $data['shipping_length_cm'] : $variante->shipping_length_cm,
                'shipping_width_cm' => array_key_exists('shipping_width_cm', $data) ? $data['shipping_width_cm'] : $variante->shipping_width_cm,
                'shipping_height_cm' => array_key_exists('shipping_height_cm', $data) ? $data['shipping_height_cm'] : $variante->shipping_height_cm,
                ]);
            } else {
                $variante = Variante::create([
                    'producto_id' => $producto->id,
                    'sku' => $data['sku_base'] ?? ('SKU-'.$producto->id),
                    'precio' => $data['precio'],
                    'peso' => $data['peso_kg'] ?? 1.0,
                'shipping_length_cm' => $data['shipping_length_cm'] ?? null,
                'shipping_width_cm' => $data['shipping_width_cm'] ?? null,
                'shipping_height_cm' => $data['shipping_height_cm'] ?? null,
                    'stock' => 0,
                    'activo' => true,
                ]);
                $diferencia = $nuevoStock;
            }

            if ($diferencia !== 0) {
                $this->adjustStock($variante, $diferencia, 'Ajuste manual desde edición de producto', $userId);
            }

            $this->syncCategories($producto, $data['categorias'] ?? []);
            $producto->imagenes()->delete();
            $this->processImages($producto, $data['imagenes'] ?? []);
            $this->syncSpecifications($producto, $data['especificaciones'] ?? []);

            return $producto;
        });
    }

    public function deleteProduct(Producto $producto): void
    {
        DB::transaction(function () use ($producto) {
            $producto->imagenes()->delete();
            $producto->variantes()->delete();
            $producto->delete();
        });
    }

    private function adjustStock(Variante $variante, int $cantidad, string $referencia, int $userId): void
    {
        if ($cantidad === 0) {
            return;
        }

        $almacenEcommerceId = (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);

        app(\App\Services\Inventario\InventoryService::class)->registrarMovimiento(
            varianteId: $variante->id,
            almacenId: $almacenEcommerceId,
            cantidad: $cantidad,
            tipo: 'ajuste',
            motivo: $referencia,
            usuarioId: $userId
        );
    }

    private function syncCategories(Producto $producto, array $categoryIds): void
    {
        \Illuminate\Support\Facades\Cache::forget('home_categorias_menu_v3');
        if (empty($categoryIds)) {
            $producto->categorias()->sync([]);

            return;
        }

        $allCats = collect($categoryIds);
        $parents = Categoria::whereIn('id', $categoryIds)->whereNotNull('categoria_padre_id')->pluck('categoria_padre_id');
        $allCats = $allCats->concat($parents)->unique()->toArray();

        $producto->categorias()->sync($allCats);
    }

    private function processImages(Producto $producto, array $images): void
    {
        foreach ($images as $i => $imageItem) {
            $url = '';
            if ($imageItem instanceof UploadedFile) {
                $url = $this->imageUploadService->uploadProductImage($imageItem);
            } elseif (is_string($imageItem)) {
                $url = $this->imageUploadService->formatExistingImageUrl($imageItem);
            }

            if (! empty($url)) {
                ProductoImagen::create([
                    'producto_id' => $producto->id,
                    'url' => $url,
                    'orden' => $i,
                ]);
            }
        }
    }

    private function syncSpecifications(Producto $producto, array $especificaciones): void
    {
        ProductoEspecificacion::where('producto_id', $producto->id)->delete();
        foreach ($especificaciones as $espec) {
            ProductoEspecificacion::create([
                'producto_id' => $producto->id,
                'clave' => $espec['nombre'],
                'valor' => $espec['valor'],
            ]);
        }
    }
}
