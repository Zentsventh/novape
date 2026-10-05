<?php

namespace Tests\Unit;

use App\Models\Marca;
use App\Models\Producto;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_works_without_scout_and_excludes_inactive_products(): void
    {
        $brand = Marca::create(['nombre' => 'Prueba']);
        Producto::create(['nombre' => 'Teclado', 'marca_id' => $brand->id, 'sku_base' => 'ABC-SEARCH', 'activo' => true]);
        Producto::create(['nombre' => 'Teclado oculto', 'marca_id' => $brand->id, 'sku_base' => 'HIDDEN', 'activo' => false]);
        $service = app(ProductService::class);
        $this->assertSame(1, $service->search('Teclado')->total());
        $this->assertSame(1, $service->search('ABC-SEARCH')->total());
        $this->assertSame(100, $service->search('', 500)->perPage());
    }

    #[Test]
    public function test_creates_a_product()
    {
        Marca::create(['nombre' => 'MarcaTest']);

        $service = $this->app->make(ProductService::class);
        $data = [
            'nombre' => 'Producto Test',
            'sku_base' => 'TEST-CREATE',
            'marca_id' => 1,
            'tipo_afectacion_igv' => 'gravado',
        ];
        $product = $service->create($data);
        $this->assertInstanceOf(Producto::class, $product);
        $this->assertDatabaseHas('producto', ['nombre' => 'Producto Test']);
    }

    #[Test]
    public function test_updates_a_product()
    {
        Marca::create(['nombre' => 'MarcaTest']);

        $product = Producto::create([
            'nombre' => 'Old Name',
            'sku_base' => 'TEST-UPDATE',
            'marca_id' => 1,
            'tipo_afectacion_igv' => 'gravado',
        ]);

        $service = $this->app->make(ProductService::class);
        $updated = $service->update($product->id, ['nombre' => 'New Name']);
        $this->assertEquals('New Name', $updated->nombre);
        $this->assertDatabaseHas('producto', ['id' => $product->id, 'nombre' => 'New Name']);
    }

    #[Test]
    public function test_deletes_a_product()
    {
        Marca::create(['nombre' => 'MarcaTest']);

        $product = Producto::create([
            'nombre' => 'To Delete',
            'sku_base' => 'TEST-DELETE',
            'marca_id' => 1,
            'tipo_afectacion_igv' => 'gravado',
        ]);

        $service = $this->app->make(ProductService::class);
        $deleted = $service->delete($product->id);
        $this->assertTrue($deleted);
        $this->assertSoftDeleted('producto', ['id' => $product->id]);
    }
}
