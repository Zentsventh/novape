<?php

namespace Tests\Feature;

use App\Services\Admin\Warehouse\InventoryAuditService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InventoryAuditCategoryTest extends TestCase
{
    public function test_inventory_uses_active_categories_and_preserves_sales_and_purchase_totals(): void
    {
        Schema::create('categoria', function (Blueprint $t) {
            $t->id(); $t->string('nombre'); $t->integer('categoria_padre_id')->nullable(); $t->boolean('activa'); $t->softDeletes();
        });
        Schema::create('marca', function (Blueprint $t) { $t->id(); $t->string('nombre'); $t->softDeletes(); });
        Schema::create('producto', function (Blueprint $t) {
            $t->id(); $t->string('nombre'); $t->integer('marca_id'); $t->boolean('activo'); $t->text('descripcion')->nullable(); $t->softDeletes();
        });
        Schema::create('variante', function (Blueprint $t) {
            $t->id(); $t->integer('producto_id'); $t->string('sku'); $t->integer('stock'); $t->decimal('precio'); $t->decimal('precio_compra');
            $t->integer('stock_minimo'); $t->integer('stock_maximo'); $t->integer('stock_seguridad'); $t->softDeletes();
        });
        Schema::create('producto_categoria', function (Blueprint $t) { $t->integer('producto_id'); $t->integer('categoria_id'); });
        Schema::create('pedido', function (Blueprint $t) { $t->id(); $t->string('estado'); });
        Schema::create('pedido_item', function (Blueprint $t) {
            $t->id(); $t->integer('pedido_id'); $t->integer('variante_id'); $t->integer('cantidad'); $t->timestamp('created_at');
        });
        Schema::create('venta_pos_items', function (Blueprint $t) { $t->id(); $t->integer('variante_id'); $t->integer('cantidad'); $t->timestamp('created_at'); });
        Schema::create('compras', function (Blueprint $t) { $t->id(); $t->string('estado'); });
        Schema::create('compra_items', function (Blueprint $t) { $t->id(); $t->integer('compra_id'); $t->integer('variante_id'); $t->integer('cantidad'); });
        DB::table('categoria')->insert([
            ['id' => 1, 'nombre' => 'Anterior', 'categoria_padre_id' => null, 'activa' => false],
            ['id' => 10, 'nombre' => 'Tecnología', 'categoria_padre_id' => null, 'activa' => true],
            ['id' => 11, 'nombre' => 'Celulares', 'categoria_padre_id' => 10, 'activa' => true],
        ]);
        DB::table('marca')->insert(['id' => 1, 'nombre' => 'Samsung']);
        DB::table('producto')->insert(['id' => 1, 'nombre' => 'Celular', 'marca_id' => 1, 'activo' => true, 'descripcion' => str_repeat('Detalle del producto. ', 10000)]);
        $variant = ['producto_id' => 1, 'stock' => 10, 'precio' => 500, 'precio_compra' => 360, 'stock_minimo' => 2, 'stock_maximo' => 20, 'stock_seguridad' => 1];
        DB::table('variante')->insert([
            [...$variant, 'id' => 1, 'sku' => 'PHONE-1', 'deleted_at' => null],
            [...$variant, 'id' => 2, 'sku' => 'RETIRED-1', 'deleted_at' => now()],
        ]);
        DB::table('producto_categoria')->insert(array_map(fn ($id) => ['producto_id' => 1, 'categoria_id' => $id], [1, 10, 11]));
        DB::table('pedido')->insert([['id' => 1, 'estado' => 'completado'], ['id' => 2, 'estado' => 'cancelado']]);
        DB::table('pedido_item')->insert([
            ['pedido_id' => 1, 'variante_id' => 1, 'cantidad' => 2, 'created_at' => now()],
            ['pedido_id' => 2, 'variante_id' => 1, 'cantidad' => 99, 'created_at' => now()],
        ]);
        DB::table('venta_pos_items')->insert(['variante_id' => 1, 'cantidad' => 3, 'created_at' => now()]);
        DB::table('compras')->insert([['id' => 1, 'estado' => 'completado'], ['id' => 2, 'estado' => 'pendiente']]);
        DB::table('compra_items')->insert([['compra_id' => 1, 'variante_id' => 1, 'cantidad' => 7], ['compra_id' => 2, 'variante_id' => 1, 'cantidad' => 99]]);

        $result = app(InventoryAuditService::class)->getDashboardData();
        $this->assertCount(1, $result['productos']);
        $row = $result['productos']->first();
        $this->assertSame(10, $row['categoria_id']);
        $this->assertSame('Tecnología', $row['categoria']);
        $this->assertSame('Samsung', $row['marca']);
        $this->assertEquals(5, $row['unidades_vendidas']);
        $this->assertEquals(7, $row['unidades_compradas']);
        $this->assertEquals(10, $row['stock']);
        $this->assertSame([10], $result['categorias']->pluck('id')->all());
    }
}
