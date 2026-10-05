<?php

namespace Tests\Feature;

use App\Models\ConfiguracionSitio;
use App\Models\Pedido;
use App\Services\Admin\Pos\PosService;
use App\Services\Admin\SupplyChain\SupplyChainService;
use App\Services\Admin\Warehouse\RmaProcessingService;
use App\Services\Admin\Warehouse\WarehouseService;
use App\Services\Inventory\InventoryService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AdminOperationsIntegrityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        ConfiguracionSitio::clearMemo();
        Schema::create('configuracion_sitio', function (Blueprint $t) {
            $t->id();
            $t->string('clave');
            $t->string('valor');
        });
        Schema::create('producto', function (Blueprint $t) {
            $t->id();
            $t->string('nombre');
            $t->boolean('activo');
            $t->softDeletes();
        });
        Schema::create('variante', function (Blueprint $t) {
            $t->id();
            $t->integer('producto_id');
            $t->string('sku');
            $t->decimal('precio');
            $t->decimal('precio_compra')->default(0);
            $t->integer('stock');
            $t->boolean('activo')->default(true);
            $t->softDeletes();
            $t->timestamps();
        });
        Schema::create('stock_almacen', function (Blueprint $t) {
            $t->id();
            $t->integer('almacen_id');
            $t->integer('variante_id');
            $t->integer('cantidad');
            $t->timestamps();
            $t->unique(['almacen_id', 'variante_id']);
        });
        Schema::create('movimientos_almacen', function (Blueprint $t) {
            $t->id();
            $t->integer('almacen_id');
            $t->integer('almacen_destino_id')->nullable();
            $t->integer('variante_id');
            $t->string('tipo');
            $t->integer('cantidad');
            $t->string('referencia');
            $t->integer('usuario_id');
            $t->timestamps();
        });
        Schema::create('cajas_sesiones', function (Blueprint $t) {
            $t->id();
            $t->integer('cajero_id');
            $t->integer('caja_id')->nullable();
            $t->string('estado');
        });
        Schema::create('cajas', function (Blueprint $t) {
            $t->id();
            $t->integer('sucursal_id');
        });
        Schema::create('metodos_pago', function (Blueprint $t) {
            $t->id();
            $t->boolean('activo');
        });
        Schema::create('comprobantes_series', function (Blueprint $t) {
            $t->id();
            $t->string('tipo_comprobante');
            $t->string('serie');
            $t->boolean('activo');
            $t->integer('correlativo_actual');
        });
        Schema::create('clientes', function (Blueprint $t) {
            $t->id();
            $t->string('tipo_documento');
            $t->string('numero_documento');
            $t->string('nombre_razon_social');
            $t->string('direccion');
            $t->timestamps();
        });
        Schema::create('ventas_pos', function (Blueprint $t) {
            $t->id();
            $t->string('codigo_ticket');
            $t->integer('cajero_id');
            $t->integer('caja_sesion_id');
            $t->integer('cliente_id')->nullable();
            $t->integer('metodo_pago_id');
            $t->decimal('subtotal');
            $t->decimal('descuento');
            $t->decimal('igv');
            $t->decimal('total');
            $t->string('tipo_comprobante');
            $t->timestamps();
        });
        Schema::create('venta_pos_pagos', function (Blueprint $t) {
            $t->id();
            $t->integer('venta_pos_id');
            $t->integer('metodo_pago_id');
            $t->decimal('monto');
            $t->timestamps();
        });
        Schema::create('venta_pos_items', function (Blueprint $t) {
            $t->id();
            $t->integer('venta_pos_id');
            $t->integer('variante_id');
            $t->string('producto_nombre');
            $t->integer('cantidad');
            $t->decimal('precio_unitario');
            $t->decimal('subtotal');
            $t->timestamps();
        });
        Schema::create('compras', function (Blueprint $t) {
            $t->id();
            $t->string('numero_orden')->unique();
            $t->integer('proveedor_id');
            $t->decimal('total');
            $t->string('estado');
            $t->text('notas')->nullable();
            $t->date('fecha_compra');
            $t->timestamps();
        });
        Schema::create('compra_items', function (Blueprint $t) {
            $t->id();
            $t->integer('compra_id');
            $t->integer('producto_id');
            $t->integer('variante_id');
            $t->integer('cantidad');
            $t->decimal('costo_unitario');
            $t->decimal('subtotal');
            $t->timestamps();
        });
        Schema::create('pedido', function (Blueprint $t) {
            $t->id();
            $t->string('codigo');
            $t->string('estado');
        });
        Schema::create('pedido_item', function (Blueprint $t) {
            $t->id();
            $t->integer('pedido_id');
            $t->integer('variante_id');
            $t->integer('cantidad');
        });
        Schema::create('rma_requests', function (Blueprint $t) {
            $t->id();
            $t->integer('pedido_id');
            $t->integer('producto_id')->nullable();
            $t->string('type');
            $t->string('status');
            $t->text('admin_notes')->nullable();
            $t->timestamps();
        });

        DB::table('producto')->insert(['id' => 1, 'nombre' => 'Producto real', 'activo' => true]);
        DB::table('variante')->insert(['id' => 1, 'producto_id' => 1, 'sku' => 'SKU-1', 'precio' => 590, 'precio_compra' => 300, 'stock' => 5]);
        DB::table('stock_almacen')->insert(['almacen_id' => 1, 'variante_id' => 1, 'cantidad' => 5]);
        DB::table('cajas_sesiones')->insert(['id' => 1, 'cajero_id' => 1, 'estado' => 'abierta']);
        DB::table('metodos_pago')->insert(['id' => 1, 'activo' => true]);
        foreach (['ticket' => 'T001', 'boleta' => 'B001', 'factura' => 'F001'] as $type => $series) {
            DB::table('comprobantes_series')->insert(['tipo_comprobante' => $type, 'serie' => $series, 'activo' => true, 'correlativo_actual' => 0]);
        }
    }

    private function sale(array $changes = []): array
    {
        return array_replace([
            'items' => [['variante_id' => 1, 'cantidad' => 1, 'precio_unitario' => 0.01, 'producto_nombre' => 'Nombre manipulado']],
            'metodo_pago_id' => 1, 'tipo_comprobante' => 'ticket', 'descuento' => 0,
        ], $changes);
    }

    public function test_pos_uses_database_price_and_name_and_reconciles_tax_payment_and_stock(): void
    {
        $result = app(PosService::class)->processSale($this->sale(), 1);
        $this->assertEquals(590, $result['total']);
        $this->assertDatabaseHas('ventas_pos', ['total' => 590, 'subtotal' => 500, 'igv' => 90]);
        $this->assertDatabaseHas('venta_pos_items', ['producto_nombre' => 'Producto real', 'precio_unitario' => 590]);
        $this->assertDatabaseHas('venta_pos_pagos', ['monto' => 590]);
        $this->assertDatabaseHas('stock_almacen', ['cantidad' => 4]);
        $this->assertDatabaseHas('variante', ['stock' => 4]);
    }

    public function test_duplicate_variant_lines_cannot_oversell(): void
    {
        $item = $this->sale()['items'][0];
        $item['cantidad'] = 4;
        try {
            app(PosService::class)->processSale($this->sale(['items' => [$item, $item]]), 1);
            $this->fail('Debe rechazar variantes repetidas.');
        } catch (\InvalidArgumentException $e) {
            $this->assertDatabaseCount('ventas_pos', 0);
            $this->assertDatabaseHas('stock_almacen', ['cantidad' => 5]);
        }
    }

    public function test_identification_rule_uses_actual_total_including_discount(): void
    {
        app(PosService::class)->processSale($this->sale(['tipo_comprobante' => 'boleta']), 1);
        $this->assertDatabaseHas('ventas_pos', ['tipo_comprobante' => 'boleta', 'total' => 590]);
        DB::table('variante')->where('id', 1)->update(['precio' => 750]);
        $this->expectException(\Exception::class);
        app(PosService::class)->processSale($this->sale(['tipo_comprobante' => 'boleta']), 1);
    }

    public function test_invalid_payments_roll_back_customer_series_and_stock(): void
    {
        $data = $this->sale(['tipo_comprobante' => 'factura', 'cliente' => ['tipo_documento' => 'RUC', 'numero_documento' => '20123456789', 'nombre_razon_social' => 'Empresa'], 'pagos' => [['metodo_pago_id' => 1, 'monto' => 10]]]);
        try {
            app(PosService::class)->processSale($data, 1);
            $this->fail('Debe rechazar pagos incompletos.');
        } catch (\Exception $e) {
            $this->assertDatabaseCount('clientes', 0);
            $this->assertDatabaseCount('ventas_pos', 0);
            $this->assertDatabaseHas('stock_almacen', ['cantidad' => 5]);
            $this->assertEquals(0, DB::table('comprobantes_series')->sum('correlativo_actual'));
        }
    }

    public function test_discount_above_sale_is_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(PosService::class)->processSale($this->sale(['descuento' => 591]), 1);
    }

    public function test_inactive_payment_is_rejected(): void
    {
        DB::table('metodos_pago')->update(['activo' => false]);
        $this->expectException(\InvalidArgumentException::class);
        app(PosService::class)->processSale($this->sale(), 1);
    }

    public function test_pos_preserves_active_ecommerce_reservations(): void
    {
        Schema::create('reservas_stock', function (Blueprint $t) {
            $t->id();
            $t->integer('variante_id');
            $t->integer('cantidad');
            $t->timestamp('expires_at');
        });
        DB::table('reservas_stock')->insert(['variante_id' => 1, 'cantidad' => 5, 'expires_at' => now()->addMinutes(15)]);
        $this->expectException(\Exception::class);
        app(PosService::class)->processSale($this->sale(), 1);
    }

    public function test_purchase_receipt_cannot_add_stock_twice(): void
    {
        $service = app(SupplyChainService::class);
        $service->createPurchaseOrder(['proveedor_id' => 1, 'items' => [['producto_id' => 1, 'variante_id' => 1, 'cantidad' => 2, 'costo_unitario' => 400]]]);
        $id = DB::table('compras')->value('id');
        $service->completePurchaseOrder($id, 1);
        try {
            $service->completePurchaseOrder($id, 1);
            $this->fail('No debe recibirse dos veces.');
        } catch (\Exception $e) {
            $this->assertDatabaseHas('stock_almacen', ['cantidad' => 7]);
            $this->assertDatabaseHas('variante', ['stock' => 7]);
            $this->assertDatabaseCount('movimientos_almacen', 1);
        }
    }

    public function test_purchase_rejects_variant_of_another_product(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        app(SupplyChainService::class)->createPurchaseOrder(['proveedor_id' => 1, 'items' => [['producto_id' => 2, 'variante_id' => 1, 'cantidad' => 2, 'costo_unitario' => 400]]]);
    }

    public function test_purchase_number_is_not_reused_after_deletion(): void
    {
        $service = app(SupplyChainService::class);
        $data = ['proveedor_id' => 1, 'items' => [['producto_id' => 1, 'variante_id' => 1, 'cantidad' => 2, 'costo_unitario' => 400]]];
        $service->createPurchaseOrder($data);
        $original = DB::table('compras')->value('numero_orden');
        $service->deletePurchaseOrder(DB::table('compras')->value('id'));
        $service->createPurchaseOrder($data);
        $this->assertNotEquals($original, DB::table('compras')->value('numero_orden'));
    }

    public function test_rma_restores_warehouse_and_global_stock_only_once(): void
    {
        DB::table('pedido')->insert(['id' => 1, 'codigo' => 'PED-1', 'estado' => 'completado']);
        DB::table('pedido_item')->insert(['pedido_id' => 1, 'variante_id' => 1, 'cantidad' => 2]);
        DB::table('rma_requests')->insert(['id' => 1, 'pedido_id' => 1, 'producto_id' => 1, 'type' => 'return', 'status' => 'received']);
        $service = app(RmaProcessingService::class);
        $service->updateStatus(1, 'processed', null, 1);
        $service->updateStatus(1, 'processed', null, 1);
        $this->assertDatabaseHas('stock_almacen', ['cantidad' => 7]);
        $this->assertDatabaseHas('variante', ['stock' => 7]);
        $this->assertDatabaseCount('movimientos_almacen', 1);
        DB::table('rma_requests')->insert(['id' => 2, 'pedido_id' => 1, 'producto_id' => 1, 'type' => 'return', 'status' => 'received']);
        $this->expectException(ValidationException::class);
        $service->updateStatus(2, 'processed', null, 1);
    }

    public function test_pending_rma_cannot_skip_approval_and_receipt(): void
    {
        DB::table('rma_requests')->insert(['id' => 1, 'pedido_id' => 1, 'type' => 'return', 'status' => 'pending']);
        $this->expectException(ValidationException::class);
        app(RmaProcessingService::class)->updateStatus(1, 'processed', null, 1);
    }

    public function test_cancellation_does_not_restock_items_already_returned_by_rma(): void
    {
        DB::table('pedido')->insert(['id' => 1, 'codigo' => 'PED-1', 'estado' => 'completado']);
        DB::table('pedido_item')->insert(['pedido_id' => 1, 'variante_id' => 1, 'cantidad' => 2]);
        DB::table('rma_requests')->insert(['id' => 1, 'pedido_id' => 1, 'producto_id' => 1, 'type' => 'return', 'status' => 'received']);
        app(RmaProcessingService::class)->updateStatus(1, 'processed', null, 1);
        $pedido = Pedido::with('items')->findOrFail(1);
        DB::transaction(fn () => app(InventoryService::class)->returnStockForOrder($pedido, 1, 'Cancelación'));
        $this->assertDatabaseHas('stock_almacen', ['cantidad' => 7]);
        $this->assertDatabaseCount('movimientos_almacen', 1);
    }

    public function test_transfer_preserves_total_and_rejects_same_warehouse(): void
    {
        $service = app(WarehouseService::class);
        $data = ['almacen_origen_id' => 1, 'almacen_destino_id' => 2, 'variante_id' => 1, 'cantidad' => 3];
        $service->transferStock($data, 1);
        $this->assertDatabaseHas('stock_almacen', ['almacen_id' => 1, 'cantidad' => 2]);
        $this->assertDatabaseHas('stock_almacen', ['almacen_id' => 2, 'cantidad' => 3]);
        $this->assertEquals(5, DB::table('stock_almacen')->sum('cantidad'));
        $data['almacen_destino_id'] = 1;
        $this->expectException(\InvalidArgumentException::class);
        $service->transferStock($data, 1);
    }
}
