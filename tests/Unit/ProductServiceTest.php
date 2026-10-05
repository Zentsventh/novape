<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Producto;
use App\Models\Marca;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class ProductServiceTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function testCreatesAProduct()
    {
        Marca::factory()->create(['id' => 1, 'nombre' => 'MarcaTest']);

        $service = $this->app->make(ProductService::class);
        $data = [
            'nombre' => 'Producto Test',
            'marca_id' => 1,
            'tipo_afectacion_igv' => 'gravado',
        ];
        $product = $service->create($data);
        $this->assertInstanceOf(Producto::class, $product);
        $this->assertDatabaseHas('producto', ['nombre' => 'Producto Test']);
    }

    #[Test]
    public function testUpdatesAProduct()
    {
        Marca::factory()->create(['id' => 1, 'nombre' => 'MarcaTest']);

        $product = Producto::create([
            'nombre' => 'Old Name',
            'marca_id' => 1,
            'tipo_afectacion_igv' => 'gravado',
        ]);

        $service = $this->app->make(ProductService::class);
        $updated = $service->update($product->id, ['nombre' => 'New Name']);
        $this->assertEquals('New Name', $updated->nombre);
        $this->assertDatabaseHas('producto', ['id' => $product->id, 'nombre' => 'New Name']);
    }

    #[Test]
    public function testDeletesAProduct()
    {
        Marca::factory()->create(['id' => 1, 'nombre' => 'MarcaTest']);

        $product = Producto::create([
            'nombre' => 'To Delete',
            'marca_id' => 1,
            'tipo_afectacion_igv' => 'gravado',
        ]);

        $service = $this->app->make(ProductService::class);
        $deleted = $service->delete($product->id);
        $this->assertTrue($deleted);
        $this->assertDatabaseMissing('producto', ['id' => $product->id]);
    }
}

