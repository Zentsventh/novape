<?php
namespace Tests\Feature;
use App\Models\{ConfiguracionSitio,Cupon,Pedido,Producto,RmaRequest,Usuario,Variante};
use App\Services\Cart\CartService;
use App\Services\Checkout\{CheckoutService,DiscountAllocation,CheckoutCompletion};
use App\Services\Orders\{OrderLoyaltyService,ReturnRequestService,UpdateOrderStatusService};
use App\Services\Storefront\VariantPricing;
use App\Services\Admin\Warehouse\RmaProcessingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB,Http,Mail,Queue,URL};
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CommerceLogicTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void
    {
        parent::setUp(); Queue::fake(); Mail::fake(); Http::preventStrayRequests();
        config(['audit.enabled'=>false,'inertia.ssr.enabled'=>false,'services.shippo.key'=>null]); session()->start();
    }
    private function fixture(): array
    {
        $warehouse=DB::table('almacenes')->insertGetId(['nombre'=>'Almacén de prueba','activo'=>true]);
        ConfiguracionSitio::establecer('almacen_ecommerce_id',$warehouse);
        $product=DB::table('producto')->insertGetId(['nombre'=>'Producto prueba','sku_base'=>'P-'.Str::uuid(),'activo'=>true]);
        $variant=DB::table('variante')->insertGetId(['producto_id'=>$product,'sku'=>'V-'.Str::uuid(),'precio'=>100,'precio_compra'=>20,'activo'=>true,'stock'=>3,'peso'=>1]);
        DB::table('stock_almacen')->insert(['almacen_id'=>$warehouse,'variante_id'=>$variant,'cantidad'=>3]);
        return [$warehouse,$variant,$product];
    }
    private function cart(int $product,int $variant): array { return [['id'=>$product,'variante_id'=>$variant,'cantidad'=>1,'precio'=>99999]]; }
    private function order(int $variant,int $warehouse,string $state='completado',?Usuario $user=null): Pedido
    {
        $order=Pedido::create(['usuario_id'=>$user?->id,'codigo'=>'TEST-'.Str::uuid(),'estado'=>$state,'subtotal'=>100,'total'=>100,'costo_envio'=>0,
            'stock_consumed_at'=>now(),'fulfilled_at'=>$state==='completado' ? now():null,'direccion_envio_snapshot'=>['email'=>'guest@example.com']]);
        $order->items()->create(['variante_id'=>$variant,'almacen_id'=>$warehouse,'cantidad'=>1,'precio_unitario'=>100,'producto_nombre'=>'Artículo prueba','net_total'=>100]);
        return $order;
    }
    public function test_json_cart_updates_authoritative_totals_without_redirecting(): void
    {
        [,$variant,$product]=$this->fixture();
        $this->postJson('/cart/add',['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>1,'precio'=>1])
            ->assertOk()->assertJsonPath('cart.count',1)->assertJsonPath('cart.total',100)
            ->assertJsonPath('cart.items.0.variante_id',$variant)->assertHeaderMissing('Location');
        $this->postJson('/cart/update',['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>2])
            ->assertOk()->assertJsonPath('cart.count',2)->assertJsonPath('cart.total',200);
        $this->postJson('/cart/update',['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>4])
            ->assertUnprocessable()->assertJsonValidationErrors('cart');
        $this->assertSame(2,session('cart')[$product]['cantidad']);
        $this->postJson('/cart/remove',['producto_id'=>$product,'variante_id'=>$variant])
            ->assertOk()->assertJsonPath('cart.count',0)->assertJsonPath('cart.items',[]);
        $this->postJson('/cart/clear')->assertOk()->assertJsonPath('cart.total',0);
    }
    public function test_authenticated_cart_bulk_sync_updates_existing_lines(): void
    {
        [,$variant,$product]=$this->fixture();
        $user=Usuario::factory()->create(); $this->actingAs($user);
        $this->postJson('/cart/add',['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>1])->assertOk();
        $this->postJson('/cart/update',['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>2])->assertOk();
        $cart=$user->carrito()->firstOrFail();
        $this->assertDatabaseCount('carrito_item',1);
        $this->assertDatabaseHas('carrito_item',['carrito_id'=>$cart->id,'variante_id'=>$variant,'cantidad'=>2]);
        $this->postJson('/cart/remove',['producto_id'=>$product,'variante_id'=>$variant])->assertOk();
        $this->assertDatabaseCount('carrito_item',0);
    }
    public function test_cart_mutations_do_not_consume_shipping_or_payment_limits(): void
    {
        [,$variant,$product]=$this->fixture();
        $payload=['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>1];
        $this->postJson('/cart/add',$payload)->assertOk();
        for ($i=0;$i<21;$i++) $this->postJson('/cart/update',$payload)->assertOk();
        $this->postJson('/cart/add',$payload)->assertOk()->assertJsonPath('cart.count',2);
        $this->postJson('/api/shipping/calculate',['address'=>['departamento'=>'LIMA','provincia'=>'LIMA','distrito'=>'Lima']])->assertOk();
        $this->postJson('/api/checkout/niubiz/session',[])->assertUnprocessable()->assertJsonValidationErrors('email');
    }
    public function test_settings_snapshot_reads_once_and_refreshes_after_changes(): void
    {
        ConfiguracionSitio::establecer('store_shipping_base','12');
        DB::enableQueryLog(); DB::flushQueryLog();
        for ($i=0;$i<20;$i++) $this->assertSame('12',ConfiguracionSitio::obtener('store_shipping_base'));
        $queries=array_filter(DB::getQueryLog(),fn($query)=>str_contains($query['query'],'select') && str_contains($query['query'],'configuracion_sitio'));
        $this->assertCount(1,$queries); DB::disableQueryLog();
        ConfiguracionSitio::establecer('store_shipping_base','18');
        $this->assertSame('18',ConfiguracionSitio::obtener('store_shipping_base'));
    }
    public function test_outbound_http_keeps_certificate_verification_enabled(): void
    {
        $this->assertFileExists(config('http.ca_bundle'));
        Http::fake(['https://certificate-test.example/*'=>Http::response(['ok'=>true])]);
        $options=null;
        Http::beforeSending(function($request,array $requestOptions) use (&$options) { $options=$requestOptions; })
            ->get('https://certificate-test.example/test');
        $this->assertSame(config('http.ca_bundle'),$options['verify']);
    }
    public function test_niubiz_authorization_applies_decimal_costs_and_never_charges_twice(): void
    {
        [$warehouse,$variant,$product]=$this->fixture();
        DB::table('variante')->where('id',$variant)->update(['precio_compra'=>20.25]);
        $this->assertSame('20.2500',Variante::findOrFail($variant)->precio_compra);
        Http::fake(['*/api.security/*'=>Http::response('security-fixture'),
            '*/api.ecommerce/*'=>Http::response(['sessionKey'=>'session-fixture']),
            '*/api.authorization/*'=>Http::response(['dataMap'=>['ACTION_CODE'=>'000']])]);
        $this->postJson('/cart/add',['producto_id'=>$product,'variante_id'=>$variant,'cantidad'=>1])->assertOk();
        $payload=['email'=>'buyer@example.com','deliveryType'=>'domicilio','facturacion'=>['comprobante'=>'Boleta'],
            'shippingAddress'=>['nombres'=>'Ana','apellidos'=>'Prueba','celular'=>'987654321','doc'=>'12345678','direccion'=>'Av. Prueba 123','distrito'=>'Lima','guardarDireccion'=>false]];
        $quote=$this->postJson('/api/checkout/niubiz/session',$payload)->assertOk()->json();
        $this->post($quote['callbackUrl'],['transactionToken'=>'transaction-fixture'])->assertRedirectContains('/checkout/niubiz/success');
        $attempt=DB::table('payment_reconciliations')->where('purchase_number',$quote['purchaseNumber'])->first();
        $this->assertSame('applied',$attempt->status);
        $this->assertSame('Pagado',Pedido::findOrFail($attempt->pedido_id)->estado);
        $this->assertSame(2,(int)DB::table('stock_almacen')->where('almacen_id',$warehouse)->where('variante_id',$variant)->value('cantidad'));
        $this->assertDatabaseHas('inventario_movimientos',['operation_key'=>'web:'.$attempt->pedido_id.':'.DB::table('pedido_item')->where('pedido_id',$attempt->pedido_id)->value('id'),'costo_unitario'=>20.25]);
        $this->post($quote['callbackUrl'],['transactionToken'=>'transaction-fixture'])->assertRedirectContains('/checkout/niubiz/success');
        $this->get($quote['callbackUrl'])->assertRedirectContains('/checkout/niubiz/success');
        $this->get('/api/checkout/niubiz/authorize?purchase='.$quote['purchaseNumber'])->assertForbidden();
        $this->assertDatabaseCount('inventario_movimientos',1);
        $this->assertDatabaseCount('comprobantes',1);
        Http::assertSentCount(4);
    }
    public function test_recorded_approval_is_recovered_without_a_provider_request(): void
    {
        [$warehouse,$variant]=$this->fixture();
        $order=$this->order($variant,$warehouse,'pendiente'); $order->update(['stock_consumed_at'=>null]);
        $id=DB::table('payment_reconciliations')->insertGetId(['pedido_id'=>$order->id,'purchase_number'=>'000000101','amount'=>100,'status'=>'approved','approved_at'=>now(),'reference_hash'=>hash('sha256','original-provider-token'),'created_at'=>now(),'updated_at'=>now()]);
        Http::fake();
        $url=URL::temporarySignedRoute('checkout.niubiz.authorize',now()->addMinutes(15),['purchase'=>'000000101']);
        $this->get($url)->assertRedirectContains('/checkout/niubiz/success');
        $this->get($url)->assertRedirectContains('/checkout/niubiz/success');
        $this->assertSame('applied',DB::table('payment_reconciliations')->where('id',$id)->value('status'));
        $this->assertDatabaseCount('inventario_movimientos',1); $this->assertDatabaseCount('pago',1); $this->assertDatabaseCount('comprobantes',1);
        $this->assertSame('niubiz:purchase:000000101',DB::table('transacciones_pago')->value('referencia_pasarela'));
        Http::assertNothingSent();
    }
    public function test_fixed_coupon_is_capped_and_shipping_remains_payable(): void
    {
        [, $variant,$product]=$this->fixture(); Cupon::create(['codigo'=>'CAP','tipo'=>'fijo','valor'=>150,'activo'=>true,'unico_por_cliente'=>false]);
        $quote=app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),'CAP',12);
        $this->assertSame(100.0,$quote['descuentoMonto']); $this->assertSame(12.0,$quote['totalConDescuento']);
    }
    public function test_zero_amount_is_rejected_before_payment_preparation(): void
    {
        [,$variant,$product]=$this->fixture(); Cupon::create(['codigo'=>'ALL','tipo'=>'porcentaje','valor'=>100,'activo'=>true,'unico_por_cliente'=>false]);
        $this->expectException(ValidationException::class);
        app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),'ALL',0);
    }
    public function test_invalid_coupon_and_guest_personal_coupon_are_explicit_errors(): void
    {
        [,$variant,$product]=$this->fixture(); $service=app(CheckoutService::class);
        foreach (['UNKNOWN','PERSONAL'] as $code) {
            if ($code==='PERSONAL') Cupon::create(['codigo'=>$code,'tipo'=>'fijo','valor'=>5,'activo'=>true,'unico_por_cliente'=>true]);
            try { $service->validateAndCalculateTotal($this->cart($product,$variant),$code,12); $this->fail('Debe rechazar cupón.'); }
            catch (ValidationException $e) { $this->assertArrayHasKey('coupon',$e->errors()); }
        }
    }
    public function test_coupon_cannot_override_its_points_combination_rule(): void
    {
        [,$variant,$product]=$this->fixture(); $this->actingAs(Usuario::factory()->create(['loyalty_points'=>100]));
        Cupon::create(['codigo'=>'EXCLUSIVE','tipo'=>'fijo','valor'=>5,'activo'=>true,'combinable_points'=>false]);
        $this->expectException(ValidationException::class);
        app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),'EXCLUSIVE',12,true);
    }
    public function test_best_promotion_agrees_between_cart_checkout_and_sql_catalog_price(): void
    {
        [,$variant,$product]=$this->fixture();
        foreach ([['porcentaje',20],['fijo',30]] as [$type,$value]) {
            $promo=DB::table('promociones')->insertGetId(['nombre'=>'Oferta prueba','activa'=>true,'tipo_descuento'=>$type,'valor_descuento'=>$value,'fecha_fin'=>now()->toDateString()]);
            DB::table('producto_promocion')->insert(['producto_id'=>$product,'promocion_id'=>$promo]);
        }
        app(CartService::class)->addProducto($product,1,session()->getId(),$variant);
        $this->assertSame(70.0,session('cart.'.$product.'.precio'));
        $quote=app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),null,12);
        $this->assertSame(70.0,$quote['total']);
        $row=Producto::whereKey($product)->addSelect(['display_price'=>VariantPricing::displayQuery()])->first();
        $this->assertSame(70.0,(float)$row->display_price);
    }
    public function test_exclusive_promotion_rejects_additional_coupon(): void
    {
        [,$variant,$product]=$this->fixture();
        $promo=DB::table('promociones')->insertGetId(['nombre'=>'Oferta','activa'=>true,'tipo_descuento'=>'fijo','valor_descuento'=>10,'combinable_coupon'=>false]);
        DB::table('producto_promocion')->insert(['producto_id'=>$product,'promocion_id'=>$promo]);
        Cupon::create(['codigo'=>'EXTRA','tipo'=>'fijo','valor'=>5,'activo'=>true]);
        $this->expectException(ValidationException::class);
        app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),'EXTRA',12);
    }
    public function test_cart_preserves_multiple_skus_without_holding_stock(): void
    {
        [$warehouse,$variant,$product]=$this->fixture();
        $second=DB::table('variante')->insertGetId(['producto_id'=>$product,'sku'=>'OTHER','precio'=>120,'activo'=>true,'stock'=>3]);
        DB::table('stock_almacen')->insert(['almacen_id'=>$warehouse,'variante_id'=>$second,'cantidad'=>3]);
        $service=app(CartService::class); $service->addProducto($product,1,session()->getId(),$variant); $service->addProducto($product,2,session()->getId(),$second);
        $this->assertCount(2,session('cart')); $this->assertDatabaseCount('reservas_stock',0);
        $this->assertFalse($service->removeProducto($product,session()->getId())['success']);
        $this->assertTrue($service->removeProducto($product,session()->getId(),$second)['success']);
        $this->assertSame($variant,session('cart.'.$product.'.variante_id'));
    }
    public function test_default_sku_skips_a_cheaper_unavailable_option(): void
    {
        [,$variant,$product]=$this->fixture();
        DB::table('variante')->insert(['producto_id'=>$product,'sku'=>'EMPTY','precio'=>1,'activo'=>true,'stock'=>0]);
        app(CartService::class)->addProducto($product,1,session()->getId());
        $this->assertSame($variant,session('cart.'.$product.'.variante_id'));
        $this->assertSame(100.0,(float)Producto::whereKey($product)->addSelect(['price'=>VariantPricing::displayQuery()])->first()->price);
    }
    public function test_discount_allocation_preserves_cents_for_many_small_lines(): void
    {
        foreach ([0.01,0.02,0.03,0.08,0.10] as $amount) {
            $result=DiscountAllocation::cents(array_fill(0,10,0.01),$amount);
            $this->assertSame((int)round($amount*100),array_sum($result));
            foreach ($result as $discount) $this->assertTrue($discount>=0 && $discount<=1);
        }
    }
    public function test_guest_signed_access_is_private_and_return_submission_is_idempotent(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse);
        $url=URL::temporarySignedRoute('store.order.access',now()->addHour(),['codigo'=>$order->codigo]);
        $this->get('/mi-compra/'.$order->codigo)->assertForbidden();
        $this->get($url)->assertOk()->assertHeader('Cache-Control','no-store, private')->assertSee($order->codigo);
        $post=URL::temporarySignedRoute('store.order.return',now()->addHour(),['codigo'=>$order->codigo]);
        $payload=['type'=>'return','reason'=>'Revisión de artículo','request_key'=>(string)Str::uuid()];
        $this->post($post,$payload)->assertRedirect(); $this->post($post,$payload)->assertRedirect();
        $this->assertDatabaseCount('rma_requests',1); $this->assertDatabaseHas('rma_requests',['usuario_id'=>null,'guest_email'=>'guest@example.com']);
    }
    public function test_return_window_uses_receipt_date_and_keeps_warranty_review_available(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse); $order->update(['fulfilled_at'=>now()->subDays(31)]);
        $service=app(ReturnRequestService::class);
        try { $service->create($order,['type'=>'return','reason'=>'Cambio de opinión'],null); $this->fail('Ventana vencida.'); }
        catch (ValidationException $e) { $this->assertArrayHasKey('pedido_id',$e->errors()); }
        $this->assertSame('warranty',$service->create($order,['type'=>'warranty','reason'=>'Defecto por revisar'],null)->type);
    }
    public function test_cancellation_after_dispatch_does_not_restock_until_rma_inspection(): void
    {
        [$warehouse,$variant]=$this->fixture(); $actor=Usuario::factory()->create(); $this->actingAs($actor,'admin');
        $order=$this->order($variant,$warehouse,'enviado'); $order->update(['dispatched_at'=>now()]);
        $order->envio()->create(['estado'=>'Enviado']);
        app(UpdateOrderStatusService::class)->execute($order,['estado'=>'cancelado']);
        $this->assertDatabaseHas('stock_almacen',['variante_id'=>$variant,'cantidad'=>3]);
        $this->assertNull($order->fresh()->stock_returned_at);
        $rma=RmaRequest::create(['pedido_id'=>$order->id,'type'=>'return','reason'=>'Recepción física','status'=>'received']);
        $item=$order->items->first();
        app(RmaProcessingService::class)->updateStatus($rma->id,'processed','Recibido e inspeccionado',$actor->id,[['pedido_item_id'=>$item->id,'cantidad'=>1,'condicion'=>'vendible']]);
        $this->assertDatabaseHas('stock_almacen',['variante_id'=>$variant,'cantidad'=>4]);
        app(RmaProcessingService::class)->updateStatus($rma->id,'processed','Recibido e inspeccionado',$actor->id);
        $this->assertDatabaseHas('stock_almacen',['variante_id'=>$variant,'cantidad'=>4]);
    }
    public function test_exchange_receipt_does_not_restock_damaged_goods_or_create_a_fake_replacement(): void
    {
        [$warehouse,$variant]=$this->fixture(); $actor=Usuario::factory()->create(); $order=$this->order($variant,$warehouse);
        $rma=RmaRequest::create(['pedido_id'=>$order->id,'type'=>'exchange','reason'=>'Revisión','status'=>'received']);
        app(RmaProcessingService::class)->updateStatus($rma->id,'processed','Recibido dañado',$actor->id,[['pedido_item_id'=>$order->items->first()->id,'cantidad'=>1,'condicion'=>'no_vendible']]);
        $this->assertDatabaseHas('stock_almacen',['variante_id'=>$variant,'cantidad'=>3]); $this->assertDatabaseCount('pedido',1);
        $this->assertDatabaseHas('rma_items',['rma_request_id'=>$rma->id,'condicion'=>'no_vendible']);
    }
    public function test_completion_requires_a_receipt_reference(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse,'enviado'); $order->envio()->create(['estado'=>'Enviado']);
        $order->pago()->create(['metodo'=>'niubiz','monto'=>100,'estado'=>'completado']);
        try { app(UpdateOrderStatusService::class)->execute($order,['estado'=>'completado']); $this->fail('Debe confirmar recepción.'); }
        catch (\InvalidArgumentException $e) { $this->assertStringContainsString('referencia',$e->getMessage()); }
        app(UpdateOrderStatusService::class)->execute($order,['estado'=>'completado','estado_envio'=>'Entregado','fulfillment_reference'=>'ACTA-PRUEBA']);
        $this->assertNotNull($order->fresh()->fulfilled_at);
    }
    public function test_loyalty_requires_consent_and_redemption_restoration_cannot_repeat(): void
    {
        [$warehouse,$variant]=$this->fixture(); $user=Usuario::factory()->create(['loyalty_points'=>0]); $order=$this->order($variant,$warehouse,'completado',$user);
        OrderLoyaltyService::completed($order); $this->assertSame(0,(int)$user->fresh()->loyalty_points);
        $order->update(['puntos_usados'=>100]);
        DB::transaction(function() use ($order) { OrderLoyaltyService::restoreRedeemed($order,40); OrderLoyaltyService::restoreRedeemed($order,40); OrderLoyaltyService::restoreRedeemed($order,100); });
        $this->assertSame(100,(int)$user->fresh()->loyalty_points); $this->assertSame(100,(int)$order->fresh()->redeemed_points_restored);
    }
    public function test_callback_completion_preserves_an_unrelated_browser_cart(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse); session(['cart'=>['other'=>'keep'],'checkout_pedido'=>'OTHER']);
        app(CheckoutCompletion::class)->complete($order); $this->assertSame(['other'=>'keep'],session('cart'));
    }
    public function test_expired_prepared_attempts_release_holds_without_external_calls(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse,'pendiente'); $order->update(['checkout_session_id'=>'old-session']);
        DB::table('reservas_stock')->insert(['session_id'=>'old-session','variante_id'=>$variant,'cantidad'=>1,'expires_at'=>now()->addMinute()]);
        DB::table('payment_reconciliations')->insert(['pedido_id'=>$order->id,'purchase_number'=>'000000101','amount'=>100,'status'=>'prepared','reference_hash'=>hash('sha256','fixture'),'expires_at'=>now()->subMinute(),'created_at'=>now(),'updated_at'=>now()]);
        $this->artisan('store:review-payment-attempts')->assertSuccessful();
        $this->assertDatabaseCount('reservas_stock',0); $this->assertDatabaseHas('payment_reconciliations',['status'=>'expired']); Http::assertNothingSent();
    }
    public function test_payment_callback_uses_persisted_purchase_in_a_different_browser(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse,'pendiente');
        $order->update(['checkout_session_id'=>'original-browser','checkout_fingerprint'=>'quote-fixture','stock_consumed_at'=>null]);
        DB::table('checkout_benefit_reservations')->insert(['pedido_id'=>$order->id,'puntos'=>0,'expires_at'=>now()->addMinutes(15),'created_at'=>now(),'updated_at'=>now()]);
        DB::table('reservas_stock')->insert(['session_id'=>'original-browser','variante_id'=>$variant,'cantidad'=>1,'expires_at'=>now()->addMinutes(15)]);
        DB::table('payment_reconciliations')->insert(['pedido_id'=>$order->id,'purchase_number'=>'000000101','amount'=>100,'status'=>'prepared','quote_hash'=>'quote-fixture','reference_hash'=>hash('sha256','prepared'),'expires_at'=>now()->addMinutes(14),'created_at'=>now(),'updated_at'=>now()]);
        Http::fake(['*/api.security/*'=>Http::response('security-fixture'), '*/api.authorization/*'=>Http::response(['dataMap'=>['ACTION_CODE'=>'000']])]);
        $unrelated=[99=>['id'=>99,'variante_id'=>99,'cantidad'=>1,'precio'=>1,'nombre'=>'Otro artículo']];
        session(['cart'=>$unrelated]);
        $url=URL::temporarySignedRoute('checkout.niubiz.authorize',now()->addMinutes(15),['purchase'=>'000000101']);
        $this->post($url,['transactionToken'=>'token-fixture'])->assertRedirectContains('/checkout/niubiz/success');
        $this->assertDatabaseHas('payment_reconciliations',['status'=>'applied']);
        $this->assertDatabaseHas('stock_almacen',['variante_id'=>$variant,'cantidad'=>2]);
        $this->assertSame($unrelated,session('cart')); Http::assertSentCount(2);
        $this->post($url,['transactionToken'=>'token-fixture'])->assertRedirectContains('/checkout/niubiz/success'); Http::assertSentCount(2);
    }
    public function test_signed_recovery_restores_pending_skus_and_blocks_uncertain_payment(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse,'pendiente');
        $url=URL::temporarySignedRoute('store.order.resume',now()->addHour(),['codigo'=>$order->codigo]);
        $this->post($url)->assertRedirect('/checkout'); $this->assertSame($order->codigo,session('checkout_pedido'));
        $this->assertSame($variant,session('cart.v-'.$variant.'.variante_id'));
        DB::table('payment_reconciliations')->insert(['pedido_id'=>$order->id,'purchase_number'=>'000000101','amount'=>100,'status'=>'needs_review','reference_hash'=>hash('sha256','uncertain'),'created_at'=>now(),'updated_at'=>now()]);
        $this->post($url)->assertSessionHasErrors('pedido'); Http::assertNothingSent();
    }
    public function test_login_merge_preserves_both_variant_choices(): void
    {
        [$warehouse,$variant,$product]=$this->fixture(); $user=Usuario::factory()->create();
        $other=DB::table('variante')->insertGetId(['producto_id'=>$product,'sku'=>'SECOND','precio'=>120,'activo'=>true,'stock'=>3]);
        DB::table('stock_almacen')->insert(['almacen_id'=>$warehouse,'variante_id'=>$other,'cantidad'=>3]);
        $saved=$user->carrito()->create(['session_id'=>'another-browser']); $saved->items()->create(['variante_id'=>$variant,'cantidad'=>2]);
        $this->actingAs($user);
        app(CartService::class)->mergeSessionAndDbCart([['id'=>$product,'variante_id'=>$other,'cantidad'=>1]],$user,session()->getId(),'guest-browser');
        $this->assertCount(2,session('cart'));
        $this->assertSame([$variant=>2,$other=>1],$saved->items()->orderBy('variante_id')->pluck('cantidad','variante_id')->all());
    }
    public function test_pickup_can_complete_from_ready_state_without_a_fake_dispatch(): void
    {
        [$warehouse,$variant]=$this->fixture(); $order=$this->order($variant,$warehouse,'procesando');
        $order->update(['direccion_envio_snapshot'=>['delivery_type'=>'tienda']]);
        $order->pago()->create(['metodo'=>'niubiz','monto'=>100,'estado'=>'completado']); $order->envio()->create(['estado'=>'Listo para recoger']);
        app(UpdateOrderStatusService::class)->execute($order,['estado'=>'completado','estado_envio'=>'Recogido','fulfillment_reference'=>'CONSTANCIA-PRUEBA']);
        $this->assertNotNull($order->fresh()->fulfilled_at); $this->assertNull($order->fresh()->dispatched_at);
        $this->assertSame('Recogido',$order->fresh()->envio->estado);
    }
    public function test_disabling_free_shipping_uses_the_configured_tariff(): void
    {
        [,$variant,$product]=$this->fixture(); DB::table('variante')->where('id',$variant)->update(['precio'=>350]);
        ConfiguracionSitio::establecer('envio_gratis','0'); ConfiguracionSitio::establecer('store_shipping_base','18');
        $quote=app(\App\Services\Shipping\ShippingCalculationService::class)->calculateCost($this->cart($product,$variant),['departamento'=>'LIMA','provincia'=>'LIMA','distrito'=>'Ate']);
        $this->assertSame(18.0,$quote['costo']); $this->assertSame('store',$quote['source']);
    }
    public function test_zero_priced_promotion_can_show_checkout_but_requires_a_positive_final_payment(): void
    {
        [,$variant,$product]=$this->fixture();
        $promo=DB::table('promociones')->insertGetId(['nombre'=>'Promoción prueba','activa'=>true,'tipo_descuento'=>'porcentaje','valor_descuento'=>100]);
        DB::table('producto_promocion')->insert(['producto_id'=>$product,'promocion_id'=>$promo]);
        $quote=app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),null,12);
        $this->assertSame(0.0,$quote['total']); $this->assertSame(12.0,$quote['totalConDescuento']);
        $this->expectException(ValidationException::class);
        app(CheckoutService::class)->validateAndCalculateTotal($this->cart($product,$variant),null,0);
    }
}
