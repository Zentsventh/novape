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
            $producto = Producto::create([
                'nombre' => $data['nombre'],
                'marca_id' => $data['marca_id'],
                'proveedor_id' => $data['proveedor_id'] ?? null,
                'sku_base' => $data['sku_base'],
                'descripcion' => $data['descripcion'] ?? null,
                'garantias' => $data['garantias'] ?? null,
                'activo' => $data['activo'] ?? true,
            ]);

            $variante = Variante::create([
                'producto_id' => $producto->id,
                'sku' => $data['sku_base'] ?? ('SKU-'.$producto->id),
                'precio' => $data['precio'],
                'peso' => $data['peso_kg'] ?? 1.0,
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
            $producto->update([
                'nombre' => $data['nombre'],
                'marca_id' => $data['marca_id'],
                'proveedor_id' => $data['proveedor_id'] ?? null,
                'sku_base' => $data['sku_base'],
                'descripcion' => $data['descripcion'] ?? null,
                'garantias' => $data['garantias'] ?? null,
                'activo' => $data['activo'] ?? true,
            ]);

            $variante = Variante::where('producto_id', $producto->id)->lockForUpdate()->first();
            $nuevoStock = (int) $data['stock'];
            $diferencia = 0;

            if ($variante) {
                $diferencia = $nuevoStock - $variante->stock;
                $variante->update([
                    'sku' => $data['sku_base'] ?? $variante->sku,
                    'precio' => $data['precio'],
                    'peso' => $data['peso_kg'] ?? 1.0,
                ]);
            } else {
                $variante = Variante::create([
                    'producto_id' => $producto->id,
                    'sku' => $data['sku_base'] ?? ('SKU-'.$producto->id),
                    'precio' => $data['precio'],
                    'peso' => $data['peso_kg'] ?? 1.0,
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

        $almacenEcommerceId = ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
        $stockAlmacen = DB::table('stock_almacen')
            ->where('almacen_id', $almacenEcommerceId)
            ->where('variante_id', $variante->id)
            ->lockForUpdate()
            ->first();
        if (($stockAlmacen->cantidad ?? 0) + $cantidad < 0) {
            throw ValidationException::withMessages([
                'stock' => 'El ajuste dejaría stock negativo en el almacén de ecommerce. Transfiere o ajusta el almacén correspondiente.',
            ]);
        }

        StockAvailability::assertRemaining($variante->id, (int) $almacenEcommerceId, (int) ($stockAlmacen->cantidad ?? 0) + $cantidad);
        if ($stockAlmacen) {
            DB::table('stock_almacen')->where('id', $stockAlmacen->id)->increment('cantidad', $cantidad);
        } else {
            DB::table('stock_almacen')->insert([
                'almacen_id' => $almacenEcommerceId,
                'variante_id' => $variante->id,
                'cantidad' => $cantidad,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('movimientos_almacen')->insert([
            'almacen_id' => $almacenEcommerceId,
            'variante_id' => $variante->id,
            'tipo' => 'ajuste',
            'cantidad' => $cantidad,
            'referencia' => $referencia,
            'usuario_id' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::statement('UPDATE variante SET stock = (SELECT COALESCE(SUM(cantidad), 0) FROM stock_almacen WHERE variante_id = ?) WHERE id = ?', [$variante->id, $variante->id]);
    }

    private function syncCategories(Producto $producto, array $categoryIds): void
    {
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
