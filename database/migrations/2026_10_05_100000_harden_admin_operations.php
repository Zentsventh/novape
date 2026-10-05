<?php

use App\Models\ConfiguracionSitio;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cajas_sesiones', function (Blueprint $t) {
            if (! Schema::hasColumn('cajas_sesiones', 'caja_id')) {
                $t->foreignId('caja_id')->nullable()->constrained('cajas')->restrictOnDelete();
            }
            if (! Schema::hasColumn('cajas_sesiones', 'almacen_id')) {
                $t->foreignId('almacen_id')->nullable()->constrained('almacenes')->restrictOnDelete();
            }
        });
        Schema::table('ventas_pos', function (Blueprint $t) {
            if (! Schema::hasColumn('ventas_pos', 'operation_key')) {
                $t->string('operation_key', 64)->nullable()->unique();
            }
            if (! Schema::hasColumn('ventas_pos', 'operation_hash')) {
                $t->string('operation_hash', 64)->nullable();
            }
            if (! Schema::hasColumn('ventas_pos', 'invoice_snapshot')) {
                $t->json('invoice_snapshot')->nullable();
            }
        });
        Schema::table('pedido', function (Blueprint $t) {
            if (! Schema::hasColumn('pedido', 'crm_deal_id')) {
                $t->foreignId('crm_deal_id')->nullable()->constrained('crm_deals')->nullOnDelete();
            }
            if (! Schema::hasColumn('pedido', 'stock_consumed_at')) {
                $t->timestamp('stock_consumed_at')->nullable();
            }
            if (! Schema::hasColumn('pedido', 'stock_returned_at')) {
                $t->timestamp('stock_returned_at')->nullable();
            }
            if (! Schema::hasColumn('pedido', 'igv_porcentaje')) {
                $t->decimal('igv_porcentaje', 5, 2)->nullable();
            }
            if (! Schema::hasColumn('pedido', 'invoice_snapshot')) {
                $t->json('invoice_snapshot')->nullable();
            }
        });
        Schema::table('pedido_item', function (Blueprint $t) {
            if (! Schema::hasColumn('pedido_item', 'producto_nombre')) {
                $t->string('producto_nombre')->nullable();
            }
            if (! Schema::hasColumn('pedido_item', 'sku')) {
                $t->string('sku')->nullable();
            }
            if (! Schema::hasColumn('pedido_item', 'costo_unitario')) {
                $t->decimal('costo_unitario', 14, 4)->nullable();
            }
            if (! Schema::hasColumn('pedido_item', 'almacen_id')) {
                $t->unsignedBigInteger('almacen_id')->nullable();
            }
        });
        Schema::table('venta_pos_items', function (Blueprint $t) {
            if (! Schema::hasColumn('venta_pos_items', 'costo_unitario')) {
                $t->decimal('costo_unitario', 14, 4)->nullable();
            }
            if (! Schema::hasColumn('venta_pos_items', 'sku')) {
                $t->string('sku')->nullable();
            }
        });
        Schema::table('crm_deal_products', function (Blueprint $t) {
            if (! Schema::hasColumn('crm_deal_products', 'variante_id')) {
                $t->foreignId('variante_id')->unsigned(false)->nullable()->constrained('variante')->restrictOnDelete();
            }
            if (! Schema::hasColumn('crm_deal_products', 'sku')) {
                $t->string('sku')->nullable();
            }
            if (! Schema::hasColumn('crm_deal_products', 'producto_nombre')) {
                $t->string('producto_nombre')->nullable();
            }
        });
        $foreignKeys = Schema::getForeignKeys('crm_deal_products');
        if (! collect($foreignKeys)->contains(fn ($key) => $key['columns'] === ['variante_id'])) {
            Schema::table('crm_deal_products', function (Blueprint $t) {
                $t->bigInteger('variante_id')->nullable()->change();
                $t->foreign('variante_id')->references('id')->on('variante')->restrictOnDelete();
            });
        }
        if (! Schema::hasColumn('crm_deals', 'fecha_cierre_real')) {
            Schema::table('crm_deals', fn (Blueprint $t) => $t->timestamp('fecha_cierre_real')->nullable());
        }
        if (! Schema::hasTable('rma_items')) {
            Schema::create('rma_items', function (Blueprint $t) {
                $t->id();
                $t->foreignId('rma_request_id')->constrained('rma_requests')->restrictOnDelete();
                $t->foreignId('pedido_item_id')->unsigned(false)->constrained('pedido_item')->restrictOnDelete();
                $t->unsignedInteger('cantidad');
                $t->string('condicion')->default('revisar');
                $t->timestamps();
                $t->unique(['rma_request_id', 'pedido_item_id']);
            });
        }
        if (! Schema::hasTable('inventory_returns')) {
            Schema::create('inventory_returns', function (Blueprint $t) {
                $t->id();
                $t->foreignId('pedido_item_id')->unsigned(false)->constrained('pedido_item')->restrictOnDelete();
                $t->string('operation_key')->unique();
                $t->unsignedInteger('cantidad');
                $t->boolean('restocked')->default(true);
                $t->unsignedBigInteger('almacen_id');
                $t->unsignedBigInteger('usuario_id')->nullable();
                $t->timestamps();
            });
        }
        if (! Schema::hasTable('marketing_deliveries')) {
            Schema::create('marketing_deliveries', function (Blueprint $t) {
                $t->id();
                $t->foreignId('campaign_id')->constrained('marketing_campaigns')->cascadeOnDelete();
                $t->unsignedBigInteger('usuario_id');
                $t->string('email');
                $t->string('status')->default('pending');
                $t->unsignedInteger('attempts')->default(0);
                $t->timestamp('sent_at')->nullable();
                $t->text('error')->nullable();
                $t->timestamps();
                $t->unique(['campaign_id', 'usuario_id']);
                $t->index(['campaign_id', 'status']);
            });
        }
        if (! Schema::hasTable('automation_executions')) {
            Schema::create('automation_executions', function (Blueprint $t) {
                $t->id();
                $t->string('event_id', 64);
                $t->unsignedBigInteger('automation_id');
                $t->unsignedInteger('action_index');
                $t->string('status')->default('pending');
                $t->text('error')->nullable();
                $t->timestamps();
                $t->unique(['event_id', 'automation_id', 'action_index'], 'automation_execution_unique');
            });
        }
        if (! Schema::hasTable('checkout_benefit_reservations')) {
            Schema::create('checkout_benefit_reservations', function (Blueprint $t) {
                $t->id();
                $t->foreignId('pedido_id')->unsigned(false)->unique()->constrained('pedido')->cascadeOnDelete();
                $t->unsignedBigInteger('usuario_id')->nullable()->index();
                $t->unsignedBigInteger('cupon_id')->nullable()->index();
                $t->unsignedInteger('puntos')->default(0);
                $t->timestamp('expires_at')->index();
                $t->timestamps();
            });
        }
        if (! Schema::hasTable('payment_reconciliations')) {
            Schema::create('payment_reconciliations', function (Blueprint $t) {
                $t->id();
                $t->string('purchase_number')->unique();
                $t->foreignId('pedido_id')->unsigned(false)->constrained('pedido')->restrictOnDelete();
                $t->decimal('amount', 14, 2);
                $t->string('status')->default('authorizing');
                $t->string('reference_hash', 64);
                $t->text('error')->nullable();
                $t->timestamp('approved_at')->nullable();
                $t->timestamps();
            });
        }
        if (! Schema::hasTable('order_notification_outbox')) {
            Schema::create('order_notification_outbox', function (Blueprint $t) {
                $t->id();
                $t->foreignId('pedido_id')->unsigned(false)->constrained('pedido')->restrictOnDelete();
                $t->string('channel');
                $t->string('destination');
                $t->json('payload');
                $t->string('status')->default('pending')->index();
                $t->text('error')->nullable();
                $t->timestamps();
            });
        }
        DB::table('permiso')->updateOrInsert(['nombre' => 'pos.descontar'], ['descripcion' => 'Aplicar descuentos autorizados en POS']);
        // Historical state is not evidence of a physical inventory move.
        DB::table('pedido')->whereExists(function ($q) {
            $q->selectRaw('1')->from('transacciones_pago')->whereColumn('transacciones_pago.pedido_id', 'pedido.id')->where('estado', 'exitoso');
        })->whereRaw('LOWER(estado) IN (?, ?, ?, ?)', ['pagado', 'procesando', 'enviado', 'completado'])
            ->update(['stock_consumed_at' => now()]);
        DB::table('rma_requests')->where('type', 'return')->where('status', 'processed')->orderBy('id')->chunkById(100, function ($rmas) {
            foreach ($rmas as $rma) {
                $items = DB::table('pedido_item')->join('variante', 'variante.id', '=', 'pedido_item.variante_id')
                    ->where('pedido_id', $rma->pedido_id)->when($rma->producto_id, fn ($q) => $q->where('variante.producto_id', $rma->producto_id))
                    ->select('pedido_item.*')->get();
                foreach ($items as $item) {
                    if (! DB::table('inventory_returns')->where('pedido_item_id', $item->id)->exists()) {
                        DB::table('inventory_returns')->insert(['pedido_item_id' => $item->id, 'operation_key' => 'legacy-rma:'.$rma->id.':'.$item->id,
                            'cantidad' => $item->cantidad, 'almacen_id' => 1, 'created_at' => now(), 'updated_at' => now()]);
                    }
                }
            }
        });
        // Existing sessions remain usable only after they are explicitly linked to a physical register.
        foreach (['whatsapp_token', 'whatsapp_verify_token', 'whatsapp_app_secret'] as $key) {
            $value = DB::table('configuracion_sitio')->where('clave', $key)->value('valor');
            if ($value && ! str_starts_with($value, 'encrypted:v1:')) {
                DB::table('configuracion_sitio')->where('clave', $key)->update(['valor' => 'encrypted:v1:'.encrypt($value, false)]);
            }
        }
        ConfiguracionSitio::clearMemo();
        Cache::forget('config_all_values');
    }

    public function down(): void
    {
        throw new RuntimeException('Esta migración conserva ventas y devoluciones. Revertir requiere un plan de datos explícito.');
    }
};
