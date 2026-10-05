<?php

namespace Tests\Feature;

use App\Services\Admin\Dashboard\AnalyticsService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminDashboardReportingTest extends TestCase
{
    public function test_product_ranking_includes_all_variants_and_separates_equal_names(): void
    {
        Schema::create('producto', function (Blueprint $t) {
            $t->id();
            $t->string('nombre');
        });
        Schema::create('variante', function (Blueprint $t) {
            $t->id();
            $t->integer('producto_id');
        });
        Schema::create('ventas_pos', function (Blueprint $t) {
            $t->id();
            $t->timestamps();
        });
        Schema::create('pedido', function (Blueprint $t) {
            $t->id();
            $t->string('estado');
            $t->timestamps();
        });
        foreach (['venta_pos_items' => 'venta_pos_id', 'pedido_item' => 'pedido_id'] as $table => $parent) {
            Schema::create($table, function (Blueprint $t) use ($parent) {
                $t->id();
                $t->integer($parent);
                $t->integer('variante_id');
                $t->integer('cantidad');
                $t->decimal('precio_unitario');
            });
        }
        DB::table('producto')->insert([['id' => 1, 'nombre' => 'Mismo nombre'], ['id' => 2, 'nombre' => 'Mismo nombre']]);
        DB::table('ventas_pos')->insert(['id' => 1, 'created_at' => now()]);
        DB::table('pedido')->insert(['id' => 1, 'estado' => 'completado', 'created_at' => now()]);
        for ($id = 1; $id <= 18; $id++) {
            DB::table('variante')->insert(['id' => $id, 'producto_id' => 1]);
            DB::table('venta_pos_items')->insert(['venta_pos_id' => 1, 'variante_id' => $id, 'cantidad' => 1, 'precio_unitario' => 10]);
        }
        DB::table('variante')->insert(['id' => 19, 'producto_id' => 2]);
        DB::table('venta_pos_items')->insert(['venta_pos_id' => 1, 'variante_id' => 19, 'cantidad' => 3, 'precio_unitario' => 10]);
        DB::table('pedido_item')->insert(['pedido_id' => 1, 'variante_id' => 19, 'cantidad' => 1, 'precio_unitario' => 10]);
        $ranking = app(AnalyticsService::class)->getTopProducts(now()->toDateString(), now()->toDateString());
        $this->assertCount(2, $ranking);
        $this->assertSame([1, 2], array_column($ranking, 'id'));
        $this->assertSame([18, 4], array_column($ranking, 'cantidad'));
        $this->assertEquals([180, 40], array_column($ranking, 'ingresos'));
    }

    public function test_order_filters_do_not_break_pos_or_expenses_and_pending_purchases_are_excluded(): void
    {
        Schema::create('producto', fn (Blueprint $t) => [$t->id(), $t->softDeletes()]);
        Schema::create('categoria', fn (Blueprint $t) => [$t->id(), $t->softDeletes()]);
        Schema::create('usuario', function (Blueprint $t) {
            $t->id();
            $t->string('nombres');
            $t->string('apellidos');
            $t->softDeletes();
        });
        Schema::create('pedido', function (Blueprint $t) {
            $t->id();
            $t->integer('usuario_id');
            $t->string('codigo');
            $t->string('estado');
            $t->decimal('total');
            $t->timestamps();
        });
        Schema::create('ventas_pos', function (Blueprint $t) {
            $t->id();
            $t->decimal('total');
            $t->timestamps();
        });
        Schema::create('gastos', function (Blueprint $t) {
            $t->id();
            $t->decimal('monto');
            $t->timestamps();
        });
        Schema::create('compras', function (Blueprint $t) {
            $t->id();
            $t->string('estado');
            $t->decimal('total');
            $t->timestamps();
        });
        $date = now()->toDateTimeString();
        DB::table('usuario')->insert(['id' => 1, 'nombres' => 'Cliente', 'apellidos' => 'Prueba']);
        DB::table('pedido')->insert(['usuario_id' => 1, 'codigo' => 'PED-1', 'estado' => 'completado', 'total' => 100, 'created_at' => $date]);
        DB::table('ventas_pos')->insert(['total' => 200, 'created_at' => $date]);
        DB::table('gastos')->insert(['monto' => 10, 'created_at' => $date]);
        DB::table('compras')->insert([['estado' => 'pendiente', 'total' => 9999, 'created_at' => $date], ['estado' => 'completado', 'total' => 50, 'created_at' => $date]]);
        $service = new class extends AnalyticsService
        {
            public function getLowStock(int $limit = 150): array
            {
                return [];
            }

            public function getTopProducts(?string $startDate, ?string $endDate): array
            {
                return [];
            }
        };
        $result = $service->getDashboardStats(now()->subDay()->toDateString(), now()->toDateString(), 'created_at', 'desc', 'completado', 'Cliente');
        $this->assertEquals(100, $result['ventasWeb']);
        $this->assertEquals(200, $result['ventasPos']);
        $this->assertEquals(300, $result['ventasTotal']);
        $this->assertEquals(60, $result['costosTotal']);
        $this->assertEquals(240, $result['gananciaNeta']);
        $this->assertCount(1, $result['pedidosRecientes']);
        $this->assertEquals('Cliente Prueba', $result['pedidosRecientes'][0]['usuario_nombre']);
    }

    public function test_export_templates_accept_dashboard_arrays(): void
    {
        $data = [
            'startDate' => '2026-10-01', 'endDate' => '2026-10-04',
            'ventasWeb' => 100, 'ventasPos' => 200, 'ventasTotal' => 300, 'costosTotal' => 60, 'gananciaNeta' => 240,
            'pedidosCount' => 1, 'logoBase64' => null, 'stockBajo' => [],
            'pedidos' => [['codigo' => 'PED-1', 'usuario_nombre' => 'Cliente Prueba', 'created_at' => now(), 'estado' => 'completado', 'total' => 100]],
            'topProductosVendidos' => [['nombre' => 'Producto Prueba', 'cantidad' => 2, 'ingresos' => 100]],
        ];
        foreach (['pdf.dashboard', 'exports.dashboard'] as $view) {
            $html = view($view, $data)->render();
            $this->assertStringContainsString('PED-1', $html);
            $this->assertStringContainsString('Cliente Prueba', $html);
            $this->assertStringContainsString('Producto Prueba', $html);
        }
    }
}
