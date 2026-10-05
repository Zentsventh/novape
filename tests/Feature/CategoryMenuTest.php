<?php

namespace Tests\Feature;

use App\Services\Catalog\CatalogQueryService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CategoryMenuTest extends TestCase
{
    public function test_menu_preserves_three_levels_and_the_brands_of_each_leaf(): void
    {
        Schema::create('categoria', function (Blueprint $table) {
            $table->id(); $table->string('nombre'); $table->string('slug');
            $table->integer('categoria_padre_id')->nullable(); $table->boolean('activa');
            $table->integer('orden'); $table->softDeletes();
        });
        Schema::create('marca', function (Blueprint $table) { $table->id(); $table->string('nombre'); });
        Schema::create('producto', function (Blueprint $table) { $table->id(); $table->integer('marca_id'); $table->boolean('activo'); $table->softDeletes(); });
        Schema::create('producto_categoria', function (Blueprint $table) { $table->integer('producto_id'); $table->integer('categoria_id'); });
        DB::table('categoria')->insert([
            ['id' => 1, 'nombre' => 'Tecnología', 'slug' => 'tecnologia', 'categoria_padre_id' => null, 'activa' => true, 'orden' => 1],
            ['id' => 2, 'nombre' => 'Celulares', 'slug' => 'celulares', 'categoria_padre_id' => 1, 'activa' => true, 'orden' => 0],
            ['id' => 3, 'nombre' => 'Smartphones', 'slug' => 'smartphones', 'categoria_padre_id' => 2, 'activa' => true, 'orden' => 0],
            ['id' => 4, 'nombre' => 'Archivada', 'slug' => 'archivada', 'categoria_padre_id' => null, 'activa' => false, 'orden' => 0],
        ]);
        DB::table('marca')->insert([['id' => 1, 'nombre' => 'Samsung'], ['id' => 2, 'nombre' => 'Xiaomi']]);
        DB::table('producto')->insert([['id' => 1, 'marca_id' => 1, 'activo' => true], ['id' => 2, 'marca_id' => 2, 'activo' => false]]);
        DB::table('producto_categoria')->insert([['producto_id' => 1, 'categoria_id' => 3], ['producto_id' => 2, 'categoria_id' => 3]]);
        $menu = app(CatalogQueryService::class)->getCategoryMenu();
        $this->assertCount(1, $menu);
        $leaf = $menu[0]['subcategorias'][0]['subcategorias'][0];
        $this->assertSame('Smartphones', $leaf['nombre']);
        $this->assertSame(3, $leaf['id']);
        $this->assertSame(['Samsung'], $leaf['marcas']->pluck('nombre')->all());
    }
}
