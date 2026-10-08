<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void
    {
        Schema::table('pedido', function (Blueprint $t) {
            if (!Schema::hasColumn('pedido', 'fulfilled_at')) $t->timestamp('fulfilled_at')->nullable();
            if (!Schema::hasColumn('pedido', 'dispatched_at')) $t->timestamp('dispatched_at')->nullable();
            if (!Schema::hasColumn('pedido', 'fulfillment_reference')) $t->string('fulfillment_reference', 255)->nullable();
            if (!Schema::hasColumn('pedido', 'commerce_policy_snapshot')) $t->json('commerce_policy_snapshot')->nullable();
            if (!Schema::hasColumn('pedido', 'checkout_fingerprint')) $t->string('checkout_fingerprint', 64)->nullable()->index();
            if (!Schema::hasColumn('pedido', 'redeemed_points_restored')) $t->unsignedInteger('redeemed_points_restored')->default(0);
        });
        Schema::table('payment_reconciliations', function (Blueprint $t) {
            if (!Schema::hasColumn('payment_reconciliations', 'expires_at')) $t->timestamp('expires_at')->nullable()->index();
            if (!Schema::hasColumn('payment_reconciliations', 'quote_hash')) $t->string('quote_hash', 64)->nullable();
            if (!Schema::hasColumn('payment_reconciliations', 'review_due_at')) $t->timestamp('review_due_at')->nullable()->index();
        });
        Schema::table('pedido_item', function (Blueprint $t) {
            if (!Schema::hasColumn('pedido_item', 'discount_amount')) $t->decimal('discount_amount', 12, 2)->nullable();
            if (!Schema::hasColumn('pedido_item', 'net_total')) $t->decimal('net_total', 12, 2)->nullable();
        });
        Schema::table('cupones', function (Blueprint $t) { 
            if (!Schema::hasColumn('cupones', 'combinable_points')) $t->boolean('combinable_points')->default(true); 
        });
        Schema::table('promociones', function (Blueprint $t) {
            if (!Schema::hasColumn('promociones', 'discount_type')) $t->string('discount_type', 20)->nullable();
            if (!Schema::hasColumn('promociones', 'discount_value')) $t->decimal('discount_value', 12, 2)->nullable();
            if (!Schema::hasColumn('promociones', 'combinable_coupon')) $t->boolean('combinable_coupon')->default(false);
        });
        Schema::table('rma_requests', function (Blueprint $t) {
            $t->bigInteger('usuario_id')->nullable()->change();
            if (!Schema::hasColumn('rma_requests', 'request_key')) $t->string('request_key', 36)->nullable()->unique();
            if (!Schema::hasColumn('rma_requests', 'guest_email')) $t->string('guest_email', 254)->nullable();
            if (!Schema::hasColumn('rma_requests', 'policy_snapshot')) $t->json('policy_snapshot')->nullable();
        });
        // Explicit operating choices; no fictional product dimensions, supplier
        // warranties, bank settlements or historical delivery dates are added.
        foreach (['store_max_quantity'=>'5','store_minimum_payment'=>'2','store_free_shipping_threshold'=>'299',
            'store_shipping_base'=>'12','store_shipping_extra_kg'=>'2','store_delivery_min_days'=>'2',
            'store_delivery_max_days'=>'5','store_return_window_days'=>'30','store_coupon_points_combinable'=>'1'] as $key=>$value) {
            if (!DB::table('configuracion_sitio')->where('clave',$key)->exists()) {
                DB::table('configuracion_sitio')->insert(['clave'=>$key,'valor'=>$value]);
            }
        }
    }
    public function down(): void { throw new RuntimeException('Preserva los contratos y evidencias comerciales mediante una migración correctiva.'); }
};
