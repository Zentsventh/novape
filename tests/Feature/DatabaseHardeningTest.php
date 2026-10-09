<?php
namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\ConfiguracionSitio;
use App\Models\Producto;
use App\Models\Usuario;
use App\Services\Admin\Product\ProductManagementService;
use App\Services\Admin\Warehouse\InventoryAuditService;
use App\Services\Admin\Warehouse\WarehouseService;
use App\Services\Inventario\InventoryService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class DatabaseHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp(); Queue::fake(); Http::preventStrayRequests(); config(['audit.enabled' => false, 'inertia.ssr.enabled' => false]);
    }

    private function fixture(int $stock = 10): array
    {
        $warehouse = DB::table('almacenes')->insertGetId(['nombre' => 'Principal', 'activo' => true]);
        ConfiguracionSitio::establecer('almacen_ecommerce_id', $warehouse);
        $product = DB::table('producto')->insertGetId(['nombre' => 'Producto', 'sku_base' => 'P-'.Str::uuid(), 'activo' => true]);
        $variant = DB::table('variante')->insertGetId(['producto_id' => $product, 'sku' => 'V-'.Str::uuid(), 'precio' => 20, 'precio_compra' => 3, 'stock' => $stock, 'activo' => true]);
        DB::table('stock_almacen')->insert(['variante_id' => $variant, 'almacen_id' => $warehouse, 'cantidad' => $stock]);
        return [$warehouse, $variant, $product];
    }

    private function user(): Usuario
    {
        return Usuario::create(['nombres' => 'Staff', 'apellidos' => 'Prueba', 'email' => Str::uuid().'@example.com', 'password_hash' => bcrypt('test-fixture')]);
    }

    public function test_manual_adjustment_endpoint_uses_the_writer_and_records_an_actor(): void
    {
        [$warehouse, $variant] = $this->fixture(); $user = $this->user();
        $this->withoutMiddleware()->actingAs($user, 'admin')->from('/admin/inventario/movimientos')
            ->post('/admin/inventario/movimientos', ['variante_id' => $variant, 'almacen_id' => $warehouse, 'tipo' => 'salida', 'cantidad' => 2, 'motivo' => 'Conteo verificado', 'operation_key' => (string) Str::uuid()])
            ->assertRedirect('/admin/inventario/movimientos')->assertSessionHas('success');
        $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'cantidad' => 8]);
        $this->assertDatabaseHas('operation_events', ['event' => 'inventory.movement', 'actor_id' => $user->id]);
    }

    public function test_shared_writer_rejects_consuming_other_customers_reservations_without_side_effects(): void
    {
        [$warehouse, $variant] = $this->fixture();
        DB::table('reservas_stock')->insert(['session_id' => 'other', 'variante_id' => $variant, 'cantidad' => 8, 'expires_at' => now()->addMinutes(5)]);
        try { app(InventoryService::class)->registrarMovimiento($variant, $warehouse, -6, 'ajuste', 'Merma'); $this->fail('Debe preservar reservas.'); }
        catch (ValidationException $e) { $this->assertArrayHasKey('cantidad', $e->errors()); }
        $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'cantidad' => 10]);
        $this->assertDatabaseCount('inventario_movimientos', 0);
    }

    public function test_order_can_consume_its_reservation_and_still_preserves_other_orders(): void
    {
        [$warehouse, $variant] = $this->fixture();
        foreach (['own' => 6, 'other' => 4] as $session => $quantity) DB::table('reservas_stock')->insert(['session_id' => $session, 'variante_id' => $variant, 'cantidad' => $quantity, 'expires_at' => now()->addMinutes(5)]);
        app(InventoryService::class)->registrarMovimiento($variant, $warehouse, -6, 'salida', 'Pedido', operationKey: 'web:test', reservationSessionId: 'own');
        $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'cantidad' => 4]);
    }

    public function test_retry_is_idempotent_and_cannot_reuse_a_key_with_another_quantity(): void
    {
        [$warehouse, $variant] = $this->fixture(); $writer = app(InventoryService::class);
        $first = $writer->registrarMovimiento($variant, $warehouse, 3, 'entrada', 'Recepción', operationKey: 'operation:test');
        $second = $writer->registrarMovimiento($variant, $warehouse, 3, 'entrada', 'Recepción', operationKey: 'operation:test');
        $this->assertSame($first->id, $second->id); $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'cantidad' => 13]);
        $this->expectException(ValidationException::class);
        $writer->registrarMovimiento($variant, $warehouse, 4, 'entrada', 'Recepción', operationKey: 'operation:test');
    }

    public function test_transfer_rolls_back_the_outgoing_leg_when_destination_is_inactive(): void
    {
        [$warehouse, $variant] = $this->fixture(); $actor = $this->user();
        $destination = DB::table('almacenes')->insertGetId(['nombre' => 'Cerrado', 'activo' => false]);
        try { app(WarehouseService::class)->transferStock(['almacen_origen_id' => $warehouse, 'almacen_destino_id' => $destination, 'variante_id' => $variant, 'cantidad' => 3, 'operation_key' => Str::uuid()], $actor->id); $this->fail('Destino inactivo.'); }
        catch (ValidationException) {}
        $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'cantidad' => 10]); $this->assertDatabaseCount('inventario_movimientos', 0);
    }

    public function test_product_edit_changes_only_the_local_warehouse_balance(): void
    {
        [$warehouse, $variant, $product] = $this->fixture(5); $actor = $this->user();
        $other = DB::table('almacenes')->insertGetId(['nombre' => 'Otro', 'activo' => true]);
        DB::table('stock_almacen')->insert(['variante_id' => $variant, 'almacen_id' => $other, 'cantidad' => 10]);
        DB::table('variante')->where('id', $variant)->update(['stock' => 15]);
        app(ProductManagementService::class)->updateProduct(Producto::findOrFail($product), ['nombre' => 'Producto', 'marca_id' => null, 'sku_base' => 'MODIFIED-SKU', 'precio' => 25, 'stock' => 8], $actor->id);
        $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'almacen_id' => $warehouse, 'cantidad' => 8]);
        $this->assertDatabaseHas('stock_almacen', ['variante_id' => $variant, 'almacen_id' => $other, 'cantidad' => 10]);
        $this->assertDatabaseHas('variante', ['id' => $variant, 'stock' => 18]);
        $this->assertDatabaseHas('historial_precio', ['variante_id' => $variant, 'precio' => 25]);
    }

    public function test_database_rejects_two_canonical_payments_for_one_order(): void
    {
        $order = DB::table('pedido')->insertGetId(['codigo' => 'ORDER', 'subtotal' => 10, 'total' => 10, 'estado' => 'pendiente']);
        DB::table('pago')->insert(['pedido_id' => $order, 'monto' => 10, 'metodo' => 'test', 'estado' => 'pendiente']);
        $this->expectException(QueryException::class);
        DB::table('pago')->insert(['pedido_id' => $order, 'monto' => 10, 'metodo' => 'test', 'estado' => 'pendiente']);
    }

    public function test_category_cannot_be_reparented_below_its_descendant(): void
    {
        $parent = Categoria::create(['nombre' => 'Padre']); $child = Categoria::create(['nombre' => 'Hijo', 'categoria_padre_id' => $parent->id]);
        $this->expectException(ValidationException::class); $parent->update(['categoria_padre_id' => $child->id]);
    }

    public function test_journal_entries_cannot_be_deleted_even_through_query_builder(): void
    {
        [$warehouse, $variant] = $this->fixture();
        $movement = app(InventoryService::class)->registrarMovimiento($variant, $warehouse, 1, 'entrada', 'Recepción');
        $this->expectException(QueryException::class);
        DB::table('inventario_movimientos')->where('id', $movement->id)->delete();
    }

    public function test_fiscal_number_uniqueness_cannot_be_bypassed_by_query_builder_or_leading_zeroes(): void
    {
        $receipt = ['tipo' => 'boleta', 'serie' => 'B001', 'numero' => '00000001', 'fiscal_environment' => 'production', 'issuer_tax_id' => '20123456789', 'total' => 10, 'igv' => 0, 'operaciones_gravadas' => 10];
        DB::table('comprobantes')->insert($receipt);
        $this->expectException(QueryException::class);
        DB::table('comprobantes')->insert(array_replace($receipt, ['numero' => '1']));
    }

    public function test_database_allows_many_secondary_addresses_but_only_one_primary(): void
    {
        $user = $this->user();
        foreach ([false, false, true] as $principal) DB::table('direccion_usuario')->insert(['usuario_id' => $user->id, 'direccion' => 'Dirección de prueba', 'principal' => $principal]);
        $this->assertDatabaseCount('direccion_usuario', 3);
        $this->expectException(QueryException::class);
        DB::table('direccion_usuario')->insert(['usuario_id' => $user->id, 'direccion' => 'Otra dirección', 'principal' => true]);
    }

    public function test_inventory_pagination_keeps_totals_for_the_entire_result(): void
    {
        [$warehouse, $variant, $product] = $this->fixture();
        for ($i = 0; $i < 55; $i++) DB::table('variante')->insert(['producto_id' => $product, 'sku' => 'PAGE-'.$i, 'precio' => 1, 'stock' => 1, 'activo' => true]);
        $result = app(InventoryAuditService::class)->getDashboardData();
        $this->assertCount(50, $result['productos']->items()); $this->assertSame(56, $result['productos']->total());
        $this->assertEquals(65, $result['kpis']->stock_disponible);
    }
}
