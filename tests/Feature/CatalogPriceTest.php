<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Variante;
use App\Services\Catalog\CatalogQueryService;
use Tests\TestCase;

class CatalogPriceTest extends TestCase
{
    private function format(?float $previous): object
    {
        $product = new Producto(['nombre' => 'Producto de prueba']);
        $product->setRelation('marca', null);
        $product->setRelation('imagenes', collect());
        $product->setRelation('categorias', collect([new Categoria(['slug' => 'cyber-bombas'])]));
        $product->setRelation('variantes', collect([new Variante(['precio' => 150, 'precio_anterior' => $previous])]));

        return (new \ReflectionMethod(CatalogQueryService::class, 'formatProducto'))
            ->invoke(new CatalogQueryService(), $product);
    }

    public function test_discount_uses_published_previous_price(): void
    {
        $result = $this->format(200);
        $this->assertSame(150.0, $result->precio_actual);
        $this->assertSame(200.0, $result->precio_anterior);
        $this->assertSame(25, $result->descuento);
    }

    public function test_promotion_category_does_not_invent_a_discount(): void
    {
        foreach ([null, 100.0, 150.0] as $previous) {
            $result = $this->format($previous);
            $this->assertNull($result->precio_anterior);
            $this->assertSame(0, $result->descuento);
        }
    }
}
