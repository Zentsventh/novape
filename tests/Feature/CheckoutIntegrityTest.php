<?php

namespace Tests\Feature;

use App\Services\Checkout\CheckoutService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CheckoutIntegrityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('variante', function (Blueprint $table) {
            $table->id();
            $table->decimal('precio', 10, 2);
            $table->integer('stock')->default(0);
            $table->boolean('activo')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
        Schema::create('configuracion_sitio', function (Blueprint $table) {
            $table->id();
            $table->string('clave');
            $table->string('valor');
        });
        Schema::create('stock_almacen', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('almacen_id');
            $table->unsignedBigInteger('variante_id');
            $table->integer('cantidad');
        });
        Schema::create('reservas_stock', function (Blueprint $table) {
            $table->id();
            $table->string('session_id');
            $table->unsignedBigInteger('variante_id');
            $table->integer('cantidad');
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('reservas_stock');
        Schema::dropIfExists('stock_almacen');
        Schema::dropIfExists('configuracion_sitio');
        Schema::dropIfExists('variante');
        parent::tearDown();
    }

    public function test_total_uses_database_price_and_rejects_negative_shipping(): void
    {
        $id = DB::table('variante')->insertGetId(['precio' => 50, 'stock' => 10, 'activo' => true]);
        $cart = [['variante_id' => $id, 'cantidad' => 2, 'precio' => 1]];
        $service = app(CheckoutService::class);

        $this->assertSame(112.0, $service->validateAndCalculateTotal($cart, null, 12)['totalConDescuento']);

        $this->expectException(\InvalidArgumentException::class);
        $service->validateAndCalculateTotal($cart, null, -10);
    }

    public function test_reservation_checks_ecommerce_warehouse_instead_of_global_stock(): void
    {
        $id = DB::table('variante')->insertGetId(['precio' => 50, 'stock' => 10, 'activo' => true]);
        DB::table('stock_almacen')->insert(['almacen_id' => 1, 'variante_id' => $id, 'cantidad' => 1]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Stock insuficiente');
        app(CheckoutService::class)->reserveStock([
            ['variante_id' => $id, 'cantidad' => 2, 'nombre' => 'Producto'],
        ], 'session-test');
    }

    public function test_reservation_sums_duplicate_variant_lines(): void
    {
        $id = DB::table('variante')->insertGetId(['precio' => 50, 'stock' => 10, 'activo' => true]);
        DB::table('stock_almacen')->insert(['almacen_id' => 1, 'variante_id' => $id, 'cantidad' => 3]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Stock insuficiente');
        app(CheckoutService::class)->reserveStock([
            ['variante_id' => $id, 'cantidad' => 2],
            ['variante_id' => $id, 'cantidad' => 2],
        ], 'session-test');
    }
}
