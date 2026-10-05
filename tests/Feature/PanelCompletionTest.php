<?php

namespace Tests\Feature;

use App\Models\CrmDeal;
use App\Models\Producto;
use App\Models\Usuario;
use App\Models\Variante;
use App\Services\Admin\Operations\PanelHealthService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Events\Looping;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PanelCompletionTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): Usuario
    {
        $user = Usuario::factory()->create();
        $role = DB::table('rol')->insertGetId(['nombre' => 'admin']);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $role]);
        $this->actingAs($user, 'admin');
        return $user;
    }

    public function test_selectors_require_staff_and_module_permissions(): void
    {
        $this->getJson('/admin/selectores/variantes')->assertUnauthorized();
        $user = Usuario::factory()->create();
        $role = DB::table('rol')->insertGetId(['nombre' => 'asesor']);
        DB::table('usuario_rol')->insert(['usuario_id' => $user->id, 'rol_id' => $role]);
        $this->actingAs($user, 'admin')->getJson('/admin/selectores/variantes')->assertForbidden();
        $this->getJson('/admin/crm/selectores/contactos')->assertForbidden();
    }

    public function test_variant_search_is_bounded_unique_and_preserves_exact_selection(): void
    {
        $this->admin();
        $product = Producto::factory()->create(['nombre' => 'Producto con variantes']);
        $variants = Variante::factory()->count(35)->create(['producto_id' => $product->id, 'activo' => true]);
        $first = $this->getJson('/admin/selectores/variantes')->assertOk()->assertJsonCount(30, 'data')->assertJsonPath('has_more', true)->json('data');
        $second = $this->getJson('/admin/selectores/variantes?page=2')->assertOk()->assertJsonCount(5, 'data')->assertJsonPath('has_more', false)->json('data');
        $this->assertCount(35, array_unique(array_column(array_merge($first, $second), 'id')));
        $selected = $variants->last();
        $this->getJson('/admin/selectores/variantes?id='.$selected->id)->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.variante_id', $selected->id)->assertJsonPath('data.0.producto_id', $product->id);
        $selected->delete();
        $this->getJson('/admin/selectores/variantes?id='.$selected->id)->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_nested_category_search_does_not_duplicate_variants_and_reports_unreserved_stock(): void
    {
        $this->admin();
        $root = DB::table('categoria')->insertGetId(['nombre' => 'Raíz', 'slug' => 'raiz', 'activa' => true]);
        $child = DB::table('categoria')->insertGetId(['nombre' => 'Grupo', 'slug' => 'grupo', 'categoria_padre_id' => $root, 'activa' => true]);
        $leaf = DB::table('categoria')->insertGetId(['nombre' => 'Hoja', 'slug' => 'hoja', 'categoria_padre_id' => $child, 'activa' => true]);
        $product = Producto::factory()->create();
        $variant = Variante::factory()->create(['producto_id' => $product->id, 'activo' => true]);
        DB::table('producto_categoria')->insert([
            ['producto_id' => $product->id, 'categoria_id' => $root], ['producto_id' => $product->id, 'categoria_id' => $leaf],
        ]);
        $warehouse = DB::table('almacenes')->insertGetId(['nombre' => 'Principal', 'activo' => true]);
        \App\Models\ConfiguracionSitio::establecer('almacen_ecommerce_id', $warehouse);
        DB::table('stock_almacen')->insert(['almacen_id' => $warehouse, 'variante_id' => $variant->id, 'cantidad' => 10]);
        DB::table('reservas_stock')->insert([
            ['session_id' => 'active', 'variante_id' => $variant->id, 'cantidad' => 3, 'expires_at' => now()->addMinute()],
            ['session_id' => 'expired', 'variante_id' => $variant->id, 'cantidad' => 5, 'expires_at' => now()->subMinute()],
        ]);
        $this->getJson('/admin/selectores/variantes?categoria_id='.$root.'&almacen_id='.$warehouse)->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.disponible', 7);
        $this->getJson('/admin/selectores/variantes?categoria_id='.$leaf)->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_contact_search_matches_full_name_without_returning_credentials(): void
    {
        $this->admin();
        $user = Usuario::factory()->create(['nombres' => 'Ana María', 'apellidos' => 'Torres']);
        Usuario::factory()->create(['nombres' => 'Ana María', 'apellidos' => 'Torres', 'estado' => 'inactivo']);
        $result = $this->getJson('/admin/crm/selectores/contactos?q=Ana%20Torres')->assertOk()->assertJsonCount(1, 'data')->json('data.0');
        $this->assertSame($user->id, $result['id']);
        $this->assertSame(['id', 'nombres', 'apellidos'], array_keys($result));
    }

    public function test_pipeline_edit_route_updates_record_and_logs_change(): void
    {
        Queue::fake();
        $this->admin();
        $pipeline = DB::table('crm_pipelines')->insertGetId(['nombre' => 'Ventas']);
        $stage = DB::table('crm_stages')->insertGetId(['pipeline_id' => $pipeline, 'nombre' => 'Contacto']);
        $next = DB::table('crm_stages')->insertGetId(['pipeline_id' => $pipeline, 'nombre' => 'Propuesta']);
        $deal = CrmDeal::create(['titulo' => 'Original', 'stage_id' => $stage, 'valor' => 10, 'estado' => 'open']);
        $this->put('/admin/crm/deals/'.$deal->id, ['titulo' => 'Actualizada', 'stage_id' => $next, 'valor' => 25, 'empresa_id' => null, 'usuario_id' => null])->assertRedirect();
        $this->assertDatabaseHas('crm_deals', ['id' => $deal->id, 'titulo' => 'Actualizada', 'stage_id' => $next, 'valor' => 25]);
        $this->assertDatabaseHas('crm_timeline_events', ['trackable_id' => $deal->id, 'event_type' => 'deal_actualizado']);
        $this->assertDatabaseHas('crm_timeline_events', ['trackable_id' => $deal->id, 'event_type' => 'deal_movido']);
    }

    public function test_health_detects_stale_processes_and_tracks_worker_queue(): void
    {
        config(['queue.default' => 'database']);
        $service = app(PanelHealthService::class);
        $this->assertFalse($service->snapshot()['ok']);
        Event::dispatch(new Looping('database', 'default,mail'));
        Cache::put('panel:scheduler', now()->timestamp, 600);
        $result = $service->snapshot();
        $this->assertTrue($result['ok']);
        $this->assertSame(0, $result['metrics']['queue']['waiting']);
        $this->assertNotNull(Cache::get(PanelHealthService::workerKey('database', 'mail')));
        $this->travel(4)->minutes();
        $this->assertFalse($service->snapshot()['ok']);
    }

    public function test_archiving_a_deal_preserves_its_timeline_and_quotes(): void
    {
        Queue::fake();
        $this->admin();
        $pipeline = DB::table('crm_pipelines')->insertGetId(['nombre' => 'Ventas']);
        $stage = DB::table('crm_stages')->insertGetId(['pipeline_id' => $pipeline, 'nombre' => 'Contacto']);
        $deal = CrmDeal::create(['titulo' => 'Conservar historial', 'stage_id' => $stage, 'valor' => 10, 'estado' => 'open']);
        $product = Producto::factory()->create();
        $variant = Variante::factory()->create(['producto_id' => $product->id]);
        $line = $deal->products()->create(['producto_id' => $product->id, 'variante_id' => $variant->id, 'cantidad' => 1, 'precio_unitario' => 10, 'subtotal' => 10]);
        $this->delete('/admin/crm/deals/'.$deal->id)->assertRedirect();
        $this->assertSoftDeleted('crm_deals', ['id' => $deal->id]);
        $this->assertDatabaseHas('crm_timeline_events', ['trackable_id' => $deal->id, 'event_type' => 'deal_archivado']);
        $this->assertDatabaseHas('crm_deal_products', ['id' => $line->id, 'crm_deal_id' => $deal->id]);
        $this->getJson('/admin/crm/selectores/oportunidades?id='.$deal->id)->assertOk()->assertJsonCount(0, 'data');
        $this->get('/admin/crm/deals/'.$deal->id)->assertNotFound();
    }

    public function test_editing_a_quote_cannot_override_its_line_total(): void
    {
        Queue::fake();
        $this->admin();
        $pipeline = DB::table('crm_pipelines')->insertGetId(['nombre' => 'Ventas']);
        $stage = DB::table('crm_stages')->insertGetId(['pipeline_id' => $pipeline, 'nombre' => 'Propuesta']);
        $deal = CrmDeal::create(['titulo' => 'Cotizada', 'stage_id' => $stage, 'valor' => 100, 'estado' => 'open']);
        $product = Producto::factory()->create();
        $variant = Variante::factory()->create(['producto_id' => $product->id]);
        $deal->products()->create(['producto_id' => $product->id, 'variante_id' => $variant->id, 'cantidad' => 2, 'precio_unitario' => 50, 'subtotal' => 100]);
        $this->put('/admin/crm/deals/'.$deal->id, ['titulo' => 'Cotizada editada', 'stage_id' => $stage, 'valor' => 1])->assertRedirect();
        $this->assertSame('100.00', $deal->fresh()->valor);
    }

    public function test_optional_opportunity_value_is_stored_as_zero(): void
    {
        Queue::fake();
        $this->admin();
        $pipeline = DB::table('crm_pipelines')->insertGetId(['nombre' => 'Ventas']);
        $stage = DB::table('crm_stages')->insertGetId(['pipeline_id' => $pipeline, 'nombre' => 'Contacto']);
        $this->post('/admin/crm/deals', ['titulo' => 'Sin importe', 'stage_id' => $stage, 'valor' => ''])->assertRedirect();
        $deal = CrmDeal::where('titulo', 'Sin importe')->firstOrFail();
        $this->assertSame('0.00', $deal->valor);
        $this->put('/admin/crm/deals/'.$deal->id, ['titulo' => 'Sin importe editada', 'stage_id' => $stage, 'valor' => ''])->assertRedirect();
        $this->assertSame('0.00', $deal->fresh()->valor);
    }

    public function test_converted_local_image_is_resolved_only_when_original_is_missing(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        config(['filesystems.default' => 'local']);
        $disk = \Illuminate\Support\Facades\Storage::disk('public');
        $disk->put('productos/efe/example_resultado.webp', 'converted');
        $image = new \App\Models\ProductoImagen(['url' => '/storage/productos/efe/example.jpg']);
        $this->assertSame('/storage/productos/efe/example_resultado.webp', $image->url);
        $disk->put('productos/efe/example.jpg', 'original');
        $this->assertSame('/storage/productos/efe/example.jpg', $image->url);
        $image->url = 'https://example.test/example.jpg';
        $this->assertSame('https://example.test/example.jpg', $image->url);
        $product = Producto::factory()->create();
        $product->imagenes()->create(['url' => '/storage/productos/tecnologia/shared_resultado.webp', 'orden' => 0]);
        $disk->put('productos/tecnologia/shared_resultado.webp', 'moved');
        $image->url = '/storage/productos/efe/shared.jpg';
        $this->assertSame('/storage/productos/tecnologia/shared_resultado.webp', $image->url);
        $image->url = '/storage/productos/efe/shared.webp';
        $this->assertSame('/storage/productos/tecnologia/shared_resultado.webp', $image->url);
    }

    public function test_product_reads_refresh_images_prices_and_stock_in_the_same_process(): void
    {
        $product = Producto::factory()->create();
        $variant = Variante::factory()->create(['producto_id' => $product->id, 'precio' => 100]);
        $warehouse = DB::table('almacenes')->insertGetId(['nombre' => 'Web', 'activo' => true]);
        \App\Models\ConfiguracionSitio::establecer('almacen_ecommerce_id', $warehouse);
        DB::table('stock_almacen')->insert(['almacen_id' => $warehouse, 'variante_id' => $variant->id, 'cantidad' => 10]);
        $image = $product->imagenes()->create(['url' => '/storage/productos/old.webp', 'orden' => 0]);
        $service = app(\App\Services\Catalog\CatalogQueryService::class);
        $first = $service->getProductData($product->slug);
        $this->assertSame(100.0, $first['producto']->precio_actual);
        $this->assertSame(10, $first['producto']->stock);
        $variant->update(['precio' => 150]);
        $image->update(['url' => '/storage/productos/new.webp']);
        DB::table('stock_almacen')->where('variante_id', $variant->id)->update(['cantidad' => 5]);
        $second = $service->getProductData($product->slug);
        $this->assertSame(150.0, $second['producto']->precio_actual);
        $this->assertSame(5, $second['producto']->stock);
        $this->assertSame('/storage/productos/new.webp', $second['detalles']['todas_imagenes'][0]);
        Cache::put('producto_'.$product->slug, ['producto' => (object) ['precio_actual' => 1]], 3600);
        $this->get('/producto/'.$product->slug)->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('Producto')->where('producto.precio_actual', 150)->where('detalles.todas_imagenes.0', '/storage/productos/new.webp'));
    }
}
