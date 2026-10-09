<?php

namespace Tests\Feature;

use App\Models\ProductoImagen;
use App\Models\Usuario;
use App\Services\Cart\CartService;
use App\Services\Catalog\CatalogQueryService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class StorefrontIntegrityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['services.shippo.key' => null]);
        // Deliberately isolated SQLite fixtures: never migrate or seed the shop database.
        Schema::create('producto', function (Blueprint $t) {
            $t->id(); $t->string('nombre'); $t->boolean('activo'); $t->softDeletes();
            $t->text('descripcion')->nullable(); $t->integer('marca_id')->nullable();
        });
        Schema::create('variante', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('producto_id'); $t->boolean('activo');
            $t->decimal('precio', 12, 2); $t->softDeletes();
            $t->decimal('peso', 12, 2)->default(1);
            $t->decimal('shipping_length_cm', 10, 2)->nullable();
            $t->decimal('shipping_width_cm', 10, 2)->nullable();
            $t->decimal('shipping_height_cm', 10, 2)->nullable();
        });
        Schema::create('producto_imagen', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('producto_id'); $t->string('url'); $t->integer('orden')->default(0);
        });
        Schema::create('configuracion_sitio', function (Blueprint $t) { $t->id(); $t->string('clave'); $t->text('valor'); });
        Schema::create('stock_almacen', function (Blueprint $t) {
            $t->id(); $t->integer('almacen_id'); $t->integer('variante_id'); $t->integer('cantidad');
        });
        Schema::create('reservas_stock', function (Blueprint $t) {
            $t->id(); $t->string('session_id'); $t->integer('variante_id'); $t->integer('cantidad');
            $t->timestamp('expires_at'); $t->timestamps();
        });
        Schema::create('promociones', function (Blueprint $t) { $t->id(); $t->boolean('activa'); $t->date('fecha_inicio')->nullable(); $t->date('fecha_fin')->nullable(); $t->string('tipo_descuento'); $t->decimal('valor_descuento',12,2); $t->boolean('combinable_coupon')->default(false); });
        Schema::create('producto_promocion', function (Blueprint $t) { $t->integer('producto_id'); $t->integer('promocion_id'); });
        Cache::flush();
        session()->start();
        DB::table('producto')->insert(['id' => 1, 'nombre' => 'Producto de prueba', 'activo' => true]);
        DB::table('variante')->insert([
            ['id' => 1, 'producto_id' => 1, 'activo' => false, 'precio' => 1],
            ['id' => 2, 'producto_id' => 1, 'activo' => true, 'precio' => 50],
            ['id' => 3, 'producto_id' => 1, 'activo' => true, 'precio' => 80],
        ]);
        DB::table('stock_almacen')->insert(['almacen_id' => 1, 'variante_id' => 2, 'cantidad' => 3]);
    }

    public function test_cart_uses_active_variant_and_server_price(): void
    {
        $result = app(CartService::class)->addProducto(1, 2, session()->getId());
        $this->assertTrue($result['success']);
        $this->assertSame(2, session('cart.1.variante_id'));
        $this->assertSame(50.0, session('cart.1.precio'));
        $this->assertDatabaseCount('reservas_stock', 0); // Cart browsing does not hold stock; payment preparation does.
    }

    public function test_inactive_product_cannot_be_added(): void
    {
        DB::table('producto')->where('id', 1)->update(['activo' => false]);
        $this->assertFalse(app(CartService::class)->addProducto(1, 1, session()->getId())['success']);
        $this->assertEmpty(session('cart', []));
    }

    public function test_reservations_from_other_visitors_limit_quantity(): void
    {
        DB::table('reservas_stock')->insert(['session_id' => 'another-visitor', 'variante_id' => 2, 'cantidad' => 2, 'expires_at' => now()->addMinutes(5)]);
        $this->assertFalse(app(CartService::class)->addProducto(1, 2, session()->getId())['success']);
        $this->assertTrue(app(CartService::class)->addProducto(1, 1, session()->getId())['success']);
    }

    public function test_stock_loss_does_not_create_a_zero_quantity_line(): void
    {
        $service = app(CartService::class);
        $service->addProducto(1, 1, session()->getId());
        DB::table('stock_almacen')->update(['cantidad' => 0]);
        $this->assertFalse($service->updateCantidad(1, 2, session()->getId())['success']);
        $this->assertSame(1, session('cart.1.cantidad'));
    }

    public function test_cart_error_triggers_inertia_validation_instead_of_success(): void
    {
        $this->from('/catalogo')->post('/cart/add', ['producto_id' => 1, 'cantidad' => 5])
            ->assertRedirect('/catalogo')->assertSessionHasErrors('cart')->assertSessionMissing('success');
    }

    public function test_image_fallback_preserves_existing_and_external_files_and_batches_queries(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('new/shared_resultado.webp', 'image');
        Storage::disk('public')->put('existing/photo.jpg', 'original');
        DB::table('producto_imagen')->insert(['producto_id' => 1, 'url' => '/storage/new/shared_resultado.webp']);
        DB::enableQueryLog();
        for ($i = 0; $i < 20; $i++) {
            $image = new ProductoImagen(['url' => '/storage/old/shared.jpg']);
            $this->assertSame('/storage/new/shared_resultado.webp', $image->url);
        }
        $this->assertCount(1, DB::getQueryLog());
        $this->assertSame('/storage/existing/photo.jpg', (new ProductoImagen(['url' => '/storage/existing/photo.jpg']))->url);
        $this->assertSame('https://example.com/photo.jpg', (new ProductoImagen(['url' => 'https://example.com/photo.jpg']))->url);
    }

    public function test_public_filter_contract_rejects_arrays_and_inverted_ranges(): void
    {
        $this->getJson('/catalogo?q[]=invalid')->assertUnprocessable()->assertJsonValidationErrors('q');
        $this->getJson('/catalogo?precio_min=100&precio_max=10')->assertUnprocessable()->assertJsonValidationErrors('precio_max');
        $this->getJson('/api/search/live?q[]=invalid')->assertUnprocessable()->assertJsonValidationErrors('q');
    }

    public function test_payment_callback_requires_an_unmodified_signature(): void
    {
        $this->post('/api/checkout/niubiz/authorize', ['transactionToken' => 'invalid'])->assertForbidden();
        $url = URL::temporarySignedRoute('checkout.niubiz.authorize', now()->addMinutes(15), ['purchase' => '123']);
        $this->post(str_replace('purchase=123', 'purchase=456', $url), ['transactionToken' => 'invalid'])->assertForbidden();
    }

    public function test_success_page_cannot_be_used_to_invent_a_paid_order(): void
    {
        $this->get('/checkout/niubiz/success')->assertForbidden();
    }

    public function test_user_serialization_never_includes_persistent_credentials(): void
    {
        $user = new Usuario(['nombres' => 'Prueba']);
        $user->forceFill(['password_hash' => 'password', 'remember_token' => 'secret', 'google_id' => 'google']);
        $this->assertArrayNotHasKey('password_hash', $user->toArray());
        $this->assertArrayNotHasKey('remember_token', $user->toArray());
        $this->assertArrayNotHasKey('google_id', $user->toArray());
    }

    public function test_shipping_is_in_pen_and_uses_current_prices_for_free_delivery(): void
    {
        $service = app(\App\Services\Shipping\ShippingCalculationService::class);
        $cart = [['id' => 1, 'variante_id' => 2, 'cantidad' => 1, 'precio' => 9999]];
        $address = ['departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Ate'];
        $this->assertSame(12.0, $service->calculateCost($cart, $address)['costo']);
        DB::table('variante')->where('id', 2)->update(['precio' => 350]);
        $this->assertSame(0.0, $service->calculateCost($cart, $address)['costo']);
    }

    private function accountUserFixtures(): Usuario
    {
        config(['audit.enabled' => false]);
        $this->withoutMiddleware(\App\Http\Middleware\HandleInertiaRequests::class);
        Schema::create('usuario', function (Blueprint $t) { $t->id(); $t->string('nombres'); $t->string('apellidos'); $t->string('email'); $t->string('password_hash'); $t->softDeletes(); $t->timestamps(); });
        Schema::create('direccion_usuario', function (Blueprint $t) {
            $t->id(); $t->integer('usuario_id'); $t->string('direccion'); $t->string('referencia')->nullable();
            $t->string('departamento'); $t->string('provincia'); $t->string('distrito'); $t->string('codigo_postal')->nullable(); $t->boolean('principal')->default(false); $t->timestamps();
        });
        DB::table('usuario')->insert(['id' => 1, 'nombres' => 'Ana', 'apellidos' => 'Prueba', 'email' => 'ana@example.com', 'password_hash' => 'fixture']);
        return Usuario::findOrFail(1);
    }

    public function test_account_addresses_persist_deduplicate_and_ignore_foreign_owner_fields(): void
    {
        $user = $this->accountUserFixtures();
        $payload = ['direccion' => 'Av. Prueba 123', 'departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Ate', 'usuario_id' => 999];
        $this->actingAs($user)->post('/perfil/direccion', $payload)->assertRedirect()->assertSessionHasNoErrors();
        $this->actingAs($user)->post('/perfil/direccion', $payload)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(1, DB::table('direccion_usuario')->count());
        $this->assertSame(1, DB::table('direccion_usuario')->value('usuario_id'));
        $this->assertTrue((bool) DB::table('direccion_usuario')->value('principal'));
    }

    public function test_account_principal_address_survives_updates_and_promotes_after_deletion(): void
    {
        $user = $this->accountUserFixtures();
        $service = app(\App\Services\User\UserProfileService::class);
        $first = ['direccion' => 'Av. Prueba 123', 'departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Ate'];
        $service->addAddress($user, $first, false);
        $service->addAddress($user, $first, false);
        $service->addAddress($user, array_merge($first, ['direccion' => 'Av. Segunda 456']), false);
        $this->assertSame(1, DB::table('direccion_usuario')->where('principal', true)->count());
        $service->deleteAddress($user, (int) DB::table('direccion_usuario')->where('principal', true)->value('id'));
        $this->assertSame('Av. Segunda 456', DB::table('direccion_usuario')->where('principal', true)->value('direccion'));
    }

    public function test_account_order_detail_uses_product_url_image_and_is_owner_only(): void
    {
        $user = $this->accountUserFixtures();
        $this->paymentFixtures('applied');
        DB::table('pedido')->where('id', 7)->update(['usuario_id' => 1]);
        Schema::create('pedido_item', function (Blueprint $t) { $t->id(); $t->integer('pedido_id'); $t->integer('variante_id'); $t->integer('cantidad'); $t->decimal('precio_unitario', 12, 2); $t->string('producto_nombre'); $t->string('sku')->nullable(); });
        Schema::create('proveedor', function (Blueprint $t) { $t->id(); $t->string('nombre'); });
        DB::table('pedido_item')->insert(['pedido_id' => 7, 'variante_id' => 2, 'cantidad' => 2, 'precio_unitario' => 50, 'producto_nombre' => 'Nombre histórico de la compra']);
        DB::table('producto_imagen')->insert(['producto_id' => 1, 'url' => '/images/product-fixture.webp', 'orden' => 1]);
        $this->actingAs($user)->get('/perfil/compras/PED-FIXTURE')->assertOk()->assertInertia(fn ($page) => $page
            ->component('Auth/OrderDetails')->where('pedido.items.0.image_url', '/images/product-fixture.webp')
            ->where('pedido.items.0.product_name', 'Nombre histórico de la compra'));
        DB::table('pedido')->where('id', 7)->update(['usuario_id' => 999]);
        $this->get('/perfil/compras/PED-FIXTURE')->assertNotFound();
    }

    public function test_shipping_rejects_regions_outside_confirmed_coverage(): void
    {
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(\App\Services\Shipping\ShippingCalculationService::class)->calculateCost([], ['departamento' => 'Arequipa', 'provincia' => 'Arequipa']);
    }

    public function test_chat_history_does_not_trust_a_client_supplied_contact_id(): void
    {
        Schema::create('omnichannel_contacts', function (Blueprint $t) { $t->id(); $t->integer('usuario_id')->nullable(); $t->text('metadata'); });
        DB::table('omnichannel_contacts')->insert(['metadata' => json_encode(['web_session_id' => 'claimed-contact-id'])]);
        $this->getJson('/chatbot/history?session_id=claimed-contact-id')->assertOk()->assertJson(['messages' => [], 'has_active_conversation' => false]);
    }

    public function test_private_evidence_is_denied_to_other_visitors(): void
    {
        Schema::create('rma_requests', function (Blueprint $t) { $t->id(); $t->integer('usuario_id'); $t->text('images'); });
        DB::table('rma_requests')->insert(['usuario_id' => 123, 'images' => json_encode(['private:rma_images/example.png'])]);
        Storage::fake('local');
        Storage::disk('local')->put('rma_images/example.png', 'evidence');
        $this->get('/devoluciones/evidencia/1/0')->assertForbidden();
    }

    public function test_password_recovery_hashes_password_and_revokes_existing_sessions(): void
    {
        config(['audit.enabled' => false]);
        Schema::create('usuario', function (Blueprint $t) {
            $t->id(); $t->string('email'); $t->string('password_hash'); $t->boolean('has_set_password')->default(false);
            $t->string('remember_token')->nullable(); $t->softDeletes(); $t->timestamps();
        });
        Schema::create('password_reset_tokens', function (Blueprint $t) { $t->string('email')->primary(); $t->string('token'); $t->timestamp('created_at')->nullable(); });
        Schema::create('sessions', function (Blueprint $t) { $t->string('id')->primary(); $t->integer('user_id'); });
        DB::table('usuario')->insert(['id' => 1, 'email' => 'test@example.com', 'password_hash' => 'old']);
        DB::table('sessions')->insert(['id' => 'old-session', 'user_id' => 1]);
        $user = Usuario::findOrFail(1);
        $token = \Illuminate\Support\Facades\Password::broker('users')->createToken($user);
        $this->post('/restablecer-contrasena', ['token' => $token, 'email' => $user->email,
            'password' => 'Secure-New123!', 'password_confirmation' => 'Secure-New123!'])->assertRedirect('/login');
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('Secure-New123!', $user->fresh()->password_hash));
        $this->assertTrue($user->fresh()->has_set_password);
        $this->assertSame(0, DB::table('sessions')->where('user_id', 1)->count());
        $this->assertSame(0, DB::table('password_reset_tokens')->count());
    }

    public function test_search_preserves_synonyms_brand_category_and_all_word_matching(): void
    {
        Schema::create('marca', function (Blueprint $t) { $t->id(); $t->string('nombre'); $t->softDeletes(); });
        Schema::create('categoria', function (Blueprint $t) { $t->id(); $t->string('nombre'); $t->softDeletes(); });
        Schema::create('producto_categoria', function (Blueprint $t) { $t->integer('producto_id'); $t->integer('categoria_id'); });
        DB::table('marca')->insert(['id' => 1, 'nombre' => 'Notebook Lenovo']);
        DB::table('categoria')->insert(['id' => 1, 'nombre' => 'Laptops']);
        DB::table('producto')->where('id', 1)->update(['descripcion' => 'Notebook Lenovo']);
        DB::table('producto')->insert([
            ['id' => 2, 'nombre' => 'Celular', 'activo' => true, 'marca_id' => null],
            ['id' => 3, 'nombre' => 'Equipo', 'activo' => true, 'marca_id' => null],
            ['id' => 4, 'nombre' => 'Otro equipo', 'activo' => true, 'marca_id' => 1],
        ]);
        DB::table('producto_categoria')->insert(['producto_id' => 3, 'categoria_id' => 1]);
        $method = new \ReflectionMethod(CatalogQueryService::class, 'applySmartSearch');
        $search = fn ($words) => $method->invoke(app(CatalogQueryService::class), \App\Models\Producto::query(), $words)
            ->pluck('producto.id')->sort()->values()->all();
        $this->assertSame([1, 3, 4], $search('laptop'));
        $this->assertSame([1, 4], $search('laptop Lenovo'));
        $this->assertSame([2], $search('celular'));
    }

    public function test_quantity_updates_refresh_the_current_server_price(): void
    {
        $service = app(CartService::class);
        $sessionId = session()->getId();
        $this->assertTrue($service->addProducto(1, 1, $sessionId)['success']);
        $variantId = session('cart')[1]['variante_id'];
        DB::table('variante')->where('id', $variantId)->update(['precio' => 123]);
        $this->assertTrue($service->updateCantidad(1, 2, $sessionId)['success']);
        $this->assertSame(123.0, session('cart')[1]['precio']);
    }

    public function test_checkout_refreshes_prices_before_showing_the_purchase(): void
    {
        $cart = [1 => ['id' => 1, 'nombre' => 'Producto', 'variante_id' => 2, 'cantidad' => 2, 'precio' => 9999]];
        $this->withSession(['cart' => $cart])->get('/checkout')->assertOk()
            ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->component('Checkout')
                ->where('cart.0.precio', 50)->where('montoTotal', 100));
        $this->assertSame(50.0, session('cart')[1]['precio']);
    }

    public function test_checkout_returns_unavailable_products_to_the_cart(): void
    {
        DB::table('producto')->where('id', 1)->update(['activo' => false]);
        $this->withSession(['cart' => [1 => ['id' => 1, 'variante_id' => 2, 'cantidad' => 1, 'precio' => 50]]])
            ->get('/checkout')->assertRedirect('/carrito')->assertSessionHas('error');
    }

    public function test_shippo_uses_real_parcels_and_selects_the_cheapest_pen_quote(): void
    {
        config(['services.shippo.key' => 'shippo_test_fixture', 'services.shippo.origin' => [
            'name' => 'Origen de prueba', 'street1' => 'Calle Origen 123', 'city' => 'Lima', 'state' => 'LMA', 'zip' => '15823', 'country' => 'PE'],
            'services.shippo.carrier_accounts' => ['carrier-fixture']]);
        DB::table('variante')->where('id', 2)->update(['shipping_length_cm' => 30, 'shipping_width_cm' => 20, 'shipping_height_cm' => 10]);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake(['api.goshippo.com/shipments/*' => \Illuminate\Support\Facades\Http::response(['rates' => [
            ['object_id' => 'usd', 'currency' => 'USD', 'amount' => '1', 'provider' => 'Incorrecto'],
            ['object_id' => 'expensive', 'currency' => 'PEN', 'amount' => '35', 'provider' => 'UPS'],
            ['object_id' => 'cheapest', 'currency' => 'USD', 'amount' => '6', 'currency_local' => 'PEN', 'amount_local' => '20', 'provider' => 'DHL', 'test' => true],
        ]], 201)]);
        $cart = [['id' => 1, 'variante_id' => 2, 'cantidad' => 2, 'precio' => 9999]];
        $address = ['departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Ate', 'direccion' => 'Calle Destino 456', 'codigo_postal' => '15012'];
        $service = app(\App\Services\Shipping\ShippingCalculationService::class);
        $result = $service->calculateCost($cart, $address);
        $this->assertSame(20.0, $result['costo']);
        $this->assertSame('shippo', $result['source']);
        $this->assertSame('cheapest', $result['rate_id']);
        $this->assertTrue($result['test']);
        $service->calculateCost($cart, $address);
        \Illuminate\Support\Facades\Http::assertSentCount(1);
        \Illuminate\Support\Facades\Http::assertSent(fn ($request) => $request['address_to']['street1'] === 'Calle Destino 456'
            && $request['address_to']['zip'] === '15012' && $request['address_from']['street1'] === 'Calle Origen 123'
            && count($request['parcels']) === 2 && (float) $request['parcels'][0]['length'] === 30.0
            && $request['parcels'][0]['distance_unit'] === 'cm' && $request['parcels'][0]['mass_unit'] === 'kg'
            && $request['carrier_accounts'] === ['carrier-fixture']);
        $address['codigo_postal'] = '15013';
        $service->calculateCost($cart, $address);
        \Illuminate\Support\Facades\Http::assertSentCount(2);
    }

    public function test_shippo_never_returns_foreign_currency_or_test_rates_with_a_live_key(): void
    {
        config(['services.shippo.key' => 'shippo_live_fixture']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake(['api.goshippo.com/*' => \Illuminate\Support\Facades\Http::response(['rates' => [
            ['object_id' => 'usd', 'currency' => 'USD', 'amount' => '1'],
            ['object_id' => 'test', 'currency' => 'PEN', 'amount' => '10', 'test' => true],
        ]], 201)]);
        $address = ['street1' => 'Calle Prueba 123', 'city' => 'Lima', 'country' => 'PE'];
        $this->assertNull(app(\App\Services\ShippoService::class)->quote($address, $address, [['length' => '10', 'width' => '10', 'height' => '10', 'distance_unit' => 'cm', 'weight' => '1', 'mass_unit' => 'kg']]));
    }

    public function test_missing_dimensions_keep_the_store_tariff_without_fake_shippo_requests(): void
    {
        config(['services.shippo.key' => 'shippo_test_fixture']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake();
        $result = app(\App\Services\Shipping\ShippingCalculationService::class)->calculateCost(
            [['id' => 1, 'variante_id' => 2, 'cantidad' => 2]],
            ['departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Ate', 'direccion' => 'Calle Prueba 123']);
        $this->assertSame('store', $result['source']);
        $this->assertSame(14.0, $result['costo']);
        \Illuminate\Support\Facades\Http::assertNothingSent();
    }

    public function test_production_checkout_does_not_use_shippo_sandbox_prices(): void
    {
        config(['services.niubiz.env' => 'production', 'services.shippo.key' => 'shippo_test_fixture']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake();
        $address = ['street1' => 'Calle Prueba 123', 'city' => 'Lima', 'country' => 'PE'];
        $this->assertNull(app(\App\Services\ShippoService::class)->quote($address, $address, [['length' => '10', 'width' => '10', 'height' => '10', 'distance_unit' => 'cm', 'weight' => '1', 'mass_unit' => 'kg']]));
        \Illuminate\Support\Facades\Http::assertNothingSent();
    }

    public function test_shipping_rejects_fake_lima_districts(): void
    {
        $this->postJson('/api/shipping/calculate', ['address' => ['departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Cusco']])
            ->assertUnprocessable()->assertJsonValidationErrors('address');
    }

    public function test_shippo_failure_uses_local_tariff_and_does_not_repeat_failed_requests(): void
    {
        config(['services.shippo.key' => 'shippo_test_fixture', 'services.shippo.origin' => [
            'street1' => 'Calle Origen 123', 'city' => 'Lima', 'country' => 'PE']]);
        DB::table('variante')->where('id', 2)->update(['shipping_length_cm' => 30, 'shipping_width_cm' => 20, 'shipping_height_cm' => 10]);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake(['api.goshippo.com/*' => \Illuminate\Support\Facades\Http::response([], 503)]);
        $cart = [['id' => 1, 'variante_id' => 2, 'cantidad' => 1]];
        $address = ['departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Ate', 'direccion' => 'Calle Prueba 123'];
        $service = app(\App\Services\Shipping\ShippingCalculationService::class);
        $this->assertSame('store', $service->calculateCost($cart, $address)['source']);
        $this->assertSame(12.0, $service->calculateCost($cart, $address)['costo']);
        \Illuminate\Support\Facades\Http::assertSentCount(1);
    }

    private function paymentFixtures(string $status): void
    {
        Schema::create('pedido', function (Blueprint $t) {
            $t->id(); $t->string('codigo'); $t->string('estado'); $t->decimal('total', 12, 2);
            $t->integer('usuario_id')->nullable(); $t->json('direccion_envio_snapshot')->nullable(); $t->timestamps();
            $t->json('invoice_snapshot')->nullable(); $t->string('tipo_comprobante')->default('Boleta');
            $t->boolean('facturado_sunat')->default(false); $t->string('comprobante_serie')->nullable(); $t->string('comprobante_correlativo')->nullable();
        });
        Schema::create('comprobantes', function (Blueprint $t) {
            $t->id(); $t->string('fiscal_environment')->default('sandbox'); $t->string('issuer_tax_id')->nullable(); $t->string('fiscal_identity')->nullable()->unique(); $t->integer('pedido_id'); $t->string('tipo'); $t->string('serie')->nullable(); $t->string('numero')->nullable();
            $t->string('codigo_ticket')->unique(); $t->string('estado_sunat'); $t->decimal('total', 12, 2); $t->decimal('igv', 12, 2); $t->decimal('operaciones_gravadas', 12, 2);
            $t->string('cliente_nombre')->nullable(); $t->string('cliente_documento')->nullable(); $t->string('cliente_tipo_documento'); $t->timestamp('emitido_at')->nullable(); $t->string('ruta_pdf')->nullable(); $t->timestamps();
        });
        Schema::create('comprobantes_series', function (Blueprint $t) { $t->id(); $t->string('tipo_comprobante'); $t->string('serie'); $t->integer('correlativo_actual'); $t->boolean('activo'); });
        DB::table('comprobantes_series')->insert(['tipo_comprobante' => 'boleta', 'serie' => 'B001', 'correlativo_actual' => 0, 'activo' => true]);
        Schema::create('payment_reconciliations', function (Blueprint $t) {
            $t->id(); $t->integer('pedido_id'); $t->string('purchase_number'); $t->string('status'); $t->decimal('amount',12,2); $t->string('reference_hash'); $t->string('quote_hash')->nullable(); $t->timestamp('expires_at')->nullable(); $t->timestamps();
            $t->text('error')->nullable(); $t->timestamp('review_due_at')->nullable();
            $t->timestamp('approved_at')->nullable();
        });
        Schema::create('checkout_benefit_reservations', function (Blueprint $t) { $t->id(); $t->integer('pedido_id'); $t->timestamp('expires_at'); });
        DB::table('pedido')->insert(['id' => 7, 'codigo' => 'PED-FIXTURE', 'estado' => $status === 'applied' ? 'Pagado' : 'Pendiente', 'total' => 100,
            'direccion_envio_snapshot' => json_encode(['email' => 'buyer@example.com']), 'created_at' => now(), 'updated_at' => now()]);
        DB::table('pedido')->where('id', 7)->update(['invoice_snapshot' => json_encode([
            'empresa' => ['razon_social' => 'Novape prueba', 'ruc' => 'No configurado', 'direccion' => 'Lima', 'telefono' => '', 'email' => ''],
            'tipo_comprobante' => 'Boleta', 'nombre_cliente' => 'Ana Prueba', 'documento_cliente' => '12345678', 'direccion_cliente' => 'Av. Prueba 123',
            'igv_porcentaje' => 18, 'subtotal' => 100, 'descuento' => 0, 'costo_envio' => 0, 'total' => 100,
            'items' => [['cantidad' => 2, 'precio_unitario' => 50, 'sku' => 'TEST', 'producto_nombre' => 'Producto prueba']],
        ])]);
        if ($status === 'applied') DB::table('payment_reconciliations')->insert([
            'pedido_id' => 7, 'purchase_number' => '000000701', 'status' => 'applied', 'reference_hash' => hash('sha256', 'transaction-fixture'), 'amount' => 100]);
        DB::table('checkout_benefit_reservations')->insert(['pedido_id' => 7, 'expires_at' => now()->addMinutes(10)]);
    }

    public function test_checkout_recovers_an_already_applied_payment_without_another_charge(): void
    {
        $this->paymentFixtures('applied');
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake();
        $response = $this->withSession(['checkout_pedido' => 'PED-FIXTURE', 'cart' => [['id' => 1, 'cantidad' => 2, 'precio' => 50]], 'niubiz_quote' => ['test' => true]])->get('/checkout');
        $response->assertRedirectContains('/checkout/niubiz/success')->assertSessionMissing('cart')->assertSessionMissing('checkout_pedido')->assertSessionMissing('niubiz_quote');
        $this->assertTrue(URL::hasValidSignature(\Illuminate\Http\Request::create($response->headers->get('Location'))));
        \Illuminate\Support\Facades\Http::assertNothingSent();
    }

    public function test_approved_payment_stays_successful_when_notifications_fail(): void
    {
        $this->paymentFixtures('pending');
        config(['services.niubiz.env' => 'sandbox']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake([
            '*/api.security/*' => \Illuminate\Support\Facades\Http::response('security-fixture', 200),
            '*/api.authorization/*' => \Illuminate\Support\Facades\Http::response(['dataMap' => ['ACTION_CODE' => '000']], 200),
        ]);
        $checkout = \Mockery::mock(\App\Services\Checkout\CheckoutService::class);
        $checkout->shouldReceive('processSuccessfulPayment')->once()->with('PED-FIXTURE', 100.0, 'transaction-fixture')->andReturnUsing(function () {
            DB::table('pedido')->where('id', 7)->update(['estado' => 'Pagado']);
            return true;
        });
        $checkout->shouldReceive('finalizeSuccessAction')->once()->andThrow(new \RuntimeException('notification-fixture-failure'));
        $this->app->instance(\App\Services\Checkout\CheckoutService::class, $checkout);
        $url = URL::temporarySignedRoute('checkout.niubiz.authorize', now()->addMinutes(15), ['purchase' => '000000701']);
        $this->withSession(['checkout_pedido' => 'PED-FIXTURE', 'niubiz_purchaseNumber' => '000000701', 'niubiz_amount' => 100,
            'cart' => [['id' => 1, 'cantidad' => 2, 'precio' => 50]]])->post($url, ['transactionToken' => 'transaction-fixture'])
            ->assertRedirectContains('/checkout/niubiz/success')->assertSessionMissing('cart');
        $this->assertSame('applied', DB::table('payment_reconciliations')->value('status'));
        $this->assertSame('Pagado', DB::table('pedido')->value('estado'));
        $this->assertSame('pendiente', DB::table('comprobantes')->value('estado_sunat'));
        $this->assertSame('B001', DB::table('comprobantes')->value('serie'));
        $this->assertSame('00000001', DB::table('comprobantes')->value('numero'));
        \Illuminate\Support\Facades\Http::assertSentCount(2);
    }

    public function test_paid_invoice_registration_is_idempotent_and_does_not_claim_fiscal_acceptance(): void
    {
        $this->paymentFixtures('applied');
        $order = \App\Models\Pedido::findOrFail(7);
        $registry = app(\App\Services\Orders\PaidInvoiceRegistry::class);
        $first = $registry->register($order);
        $second = $registry->register($order);
        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, DB::table('comprobantes')->count());
        $this->assertSame(1, DB::table('comprobantes_series')->value('correlativo_actual'));
        $this->assertSame('pendiente', $first->estado_sunat);
        $this->assertNull($first->emitido_at);
        $this->assertSame('100.00', $first->total);
        $this->assertSame('12345678', $first->cliente_documento);
    }

    public function test_provider_approval_survives_a_local_application_failure(): void
    {
        $this->paymentFixtures('pending');
        config(['services.niubiz.env' => 'sandbox']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake([
            '*/api.security/*' => \Illuminate\Support\Facades\Http::response('security-fixture', 200),
            '*/api.authorization/*' => \Illuminate\Support\Facades\Http::response(['dataMap' => ['ACTION_CODE' => '000']], 200),
        ]);
        $checkout = \Mockery::mock(\App\Services\Checkout\CheckoutService::class);
        $checkout->shouldReceive('processSuccessfulPayment')->once()->andThrow(new \TypeError('Costo decimal recibido como texto'));
        $this->app->instance(\App\Services\Checkout\CheckoutService::class, $checkout);
        $url = URL::temporarySignedRoute('checkout.niubiz.authorize', now()->addMinutes(15), ['purchase' => '000000701']);
        $this->withSession(['checkout_pedido' => 'PED-FIXTURE', 'niubiz_purchaseNumber' => '000000701', 'niubiz_amount' => 100])
            ->post($url, ['transactionToken' => 'transaction-fixture'])->assertRedirect('/checkout');
        $this->assertSame('approved', DB::table('payment_reconciliations')->value('status'));
        $this->assertSame('Pendiente', DB::table('pedido')->value('estado'));
    }

    public function test_receipt_pdf_renders_from_frozen_order_data(): void
    {
        $this->paymentFixtures('applied');
        $pdf = app(\App\Services\Orders\InvoiceService::class)->generatePdf(\App\Models\Pedido::findOrFail(7))->output();
        $this->assertStringStartsWith('%PDF-', $pdf);
        $this->assertGreaterThan(5000, strlen($pdf));
        $this->assertSame(1, DB::table('comprobantes')->count());
        $this->get('/comprobante/ecommerce/PED-FIXTURE')->assertForbidden();
    }

    public function test_invoice_amount_in_words_has_cents_and_handles_rounding(): void
    {
        $this->assertSame('OCHOCIENTOS CINCUENTA Y OCHO CON 00/100 SOLES', \App\Helpers\NumberToWords::convert(858));
        $this->assertSame('CIEN CON 00/100 SOLES', \App\Helpers\NumberToWords::convert(99.995));
        $this->assertSame('MIL CON 25/100 SOLES', \App\Helpers\NumberToWords::convert(1000.25));
        $this->assertSame('VEINTIÚN CON 00/100 SOLES', \App\Helpers\NumberToWords::convert(21));
    }

    public function test_signed_receipt_download_is_private_stable_and_rejects_unpaid_orders(): void
    {
        $this->paymentFixtures('applied');
        Storage::fake('local');
        $url = URL::temporarySignedRoute('comprobante.ecommerce.publico', now()->addHours(24), ['codigo' => 'PED-FIXTURE']);
        $first = $this->get($url)->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $content = $first->streamedContent();
        $this->assertStringStartsWith('%PDF-', $content);
        $this->assertSame($content, $this->get($url)->assertOk()->streamedContent());
        $this->assertSame(1, DB::table('comprobantes')->count());
        Storage::disk('local')->assertExists(DB::table('comprobantes')->value('ruta_pdf'));
        DB::table('pedido')->where('id', 7)->update(['estado' => 'Pendiente']);
        $this->get($url)->assertForbidden();
    }

    public function test_payment_quote_supports_pickup_and_returns_server_totals(): void
    {
        Schema::create('pedido',function(Blueprint $t) { $t->id(); $t->integer('usuario_id')->nullable(); $t->string('codigo'); $t->string('checkout_fingerprint')->nullable(); });
        Schema::create('payment_reconciliations', function (Blueprint $t) {
            $t->id(); $t->integer('pedido_id'); $t->string('purchase_number'); $t->string('status'); $t->decimal('amount',12,2); $t->string('reference_hash'); $t->string('quote_hash')->nullable(); $t->timestamp('expires_at')->nullable(); $t->timestamps();
        });
        Schema::create('almacenes', function (Blueprint $t) {
            $t->id(); $t->string('nombre'); $t->string('direccion'); $t->boolean('activo');
        });
        DB::table('almacenes')->insert(['id' => 1, 'nombre' => 'Sede de prueba', 'direccion' => 'Av. Prueba 123', 'activo' => true]);
        DB::table('configuracion_sitio')->insert([
            ['clave' => 'pickup_enabled', 'valor' => '1'], ['clave' => 'pickup_hours', 'valor' => 'Lunes a viernes de 9 a 18'],
        ]);
        config(['services.niubiz.env' => 'sandbox']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake([
            '*/api.security/*' => \Illuminate\Support\Facades\Http::response('security-fixture', 200),
            '*/api.ecommerce/*' => \Illuminate\Support\Facades\Http::response(['sessionKey' => 'session-fixture'], 200),
        ]);
        $cart = [1 => ['id' => 1, 'nombre' => 'Producto', 'variante_id' => 2, 'cantidad' => 2, 'precio' => 9999]];
        $checkout = \Mockery::mock(\App\Services\Checkout\CheckoutService::class);
        $checkout->shouldReceive('validateAndCalculateTotal')->times(5)->andReturnUsing(function ($items, $coupon, $shipping) use ($cart) {
            $current = $cart; $current[1]['precio'] = 50;
            return ['total' => 100, 'totalConDescuento' => 100 + $shipping, 'descuentoMonto' => 0, 'puntosUsados' => 0, 'couponId' => null, 'cart' => $current];
        });
        $checkout->shouldReceive('reserveStock')->times(4);
        $order = new \App\Models\Pedido(); $order->id = 5; $order->codigo = 'PED-QUOTE';
        $checkout->shouldReceive('createPendingOrder')->times(4)->withArgs(fn ($data, $address, $document, $name, $billingAddress, $receipt, $shipping) =>
            $address['nombres'] === 'Ana' && $address['apellidos'] === 'Prueba' && $address['celular'] === '987654321'
            && $document === '12345678' && $name === 'Ana Prueba' && $receipt === 'Boleta'
            && ($address['guardarDireccion'] ?? false) === ($shipping > 0))->andReturn($order);
        $this->app->instance(\App\Services\Checkout\CheckoutService::class, $checkout);
        $payload = ['email' => 'buyer@example.com', 'facturacion' => ['comprobante' => 'Boleta'],
            'shippingAddress' => ['nombres' => 'Ana', 'apellidos' => 'Prueba', 'celular' => '987654321', 'doc' => '12345678', 'direccion' => '', 'distrito' => '', 'guardarDireccion' => true, 'pickup_location_id' => 1],
            'deliveryType' => 'tienda', 'shippingCost' => 9999];
        $first = $this->withSession(['cart' => $cart])->postJson('/api/checkout/niubiz/session', $payload)->assertOk()
            ->assertJsonPath('summary.subtotal', 100)->assertJsonPath('summary.shipping', 0)->assertJsonPath('amount', 100)
            ->assertJsonPath('items.0.precio', 50)->assertJsonPath('testCard.number', '4551708161768059')
            ->assertJsonPath('testCard.expiry', '03/28')->assertJsonPath('testCard.cvv', '111');
        // Identical valid quotes reuse the token; near-expiry quotes must renew.
        $this->postJson('/api/checkout/niubiz/session', $payload)->assertOk()
            ->assertJsonPath('purchaseNumber', $first->json('purchaseNumber'));
        \Illuminate\Support\Facades\Http::assertSentCount(2);
        $nearExpiry = session('niubiz_quote');
        $nearExpiry['expires'] = time() + 299;
        $nearExpiry['data']['expiresAt'] = (time() + 299) * 1000;
        $renewed = $this->withSession(['niubiz_quote' => $nearExpiry])->postJson('/api/checkout/niubiz/session', $payload)->assertOk();
        $this->assertNotSame($first->json('purchaseNumber'), $renewed->json('purchaseNumber'));
        $this->assertGreaterThan((time() + 300) * 1000, $renewed->json('expiresAt'));
        $payload['deliveryType'] = 'domicilio';
        $payload['shippingAddress']['direccion'] = 'Av. Prueba 123'; $payload['shippingAddress']['distrito'] = 'Ate';
        $this->postJson('/api/checkout/niubiz/session', $payload)->assertOk()->assertJsonPath('summary.shipping', 14)->assertJsonPath('amount', 114);
        // Switching to production must not reuse a sandbox quote or expose its card.
        config(['services.niubiz.env' => 'production']);
        $production = $this->postJson('/api/checkout/niubiz/session', $payload)->assertOk()
            ->assertJsonPath('env', 'production')->assertJsonMissingPath('testCard');
        $this->assertNotSame($renewed->json('purchaseNumber'), $production->json('purchaseNumber'));
        \Illuminate\Support\Facades\Http::assertSentCount(8);
    }
}
