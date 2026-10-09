<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('database_repair_events', function (Blueprint $t) {
            $t->id(); $t->string('operation_key')->unique(); $t->string('kind');
            $t->json('details'); $t->timestamp('created_at');
        });
        Schema::create('data_quality_issues', function (Blueprint $t) {
            $t->id(); $t->string('issue_key')->unique(); $t->string('category');
            $t->string('source_table'); $t->unsignedBigInteger('source_id')->nullable();
            $t->string('status')->default('open'); $t->json('details'); $t->timestamps();
            $t->index(['status', 'category']);
        });
        Schema::table('inventario_movimientos', function (Blueprint $t) {
            $t->string('operation_key')->nullable()->unique();
            $t->index(['almacen_id', 'created_at', 'id'], 'inventory_warehouse_date_idx');
            $t->decimal('costo_unitario', 14, 4)->nullable()->change();
        });
        Schema::table('pedido', function (Blueprint $t) {
            $t->string('checkout_session_id', 100)->nullable();
            $t->char('currency', 3)->default('PEN');
            $t->index(['estado', 'created_at'], 'pedido_state_date_idx');
        });
        Schema::table('ventas_pos', function (Blueprint $t) {
            $t->char('currency', 3)->default('PEN'); $t->index('created_at', 'pos_date_idx');
        });
        Schema::table('compras', function (Blueprint $t) {
            $t->json('proveedor_snapshot')->nullable(); $t->char('currency', 3)->default('PEN');
            $t->index(['estado', 'fecha_compra'], 'purchase_state_date_idx');
        });
        Schema::table('historial_precio', function (Blueprint $t) {
            $t->bigInteger('usuario_id')->nullable(); $t->string('motivo')->nullable();
            $t->index(['variante_id', 'fecha_inicio'], 'price_history_date_idx');
        });
        Schema::table('variante', fn (Blueprint $t) => $t->decimal('precio_compra', 14, 4)->default(0)->change());
        Schema::table('reservas_stock', fn (Blueprint $t) => $t->index(['variante_id', 'expires_at', 'session_id'], 'reservation_availability_idx'));
        Schema::table('clientes', function (Blueprint $t) {
            $t->bigInteger('usuario_id')->nullable()->unique();
            $t->foreign('usuario_id')->references('id')->on('usuario')->restrictOnDelete();
        });
        Schema::table('comprobantes', function (Blueprint $t) {
            $t->string('fiscal_environment', 30)->default('sandbox');
            $t->string('issuer_tax_id', 20)->default('unconfigured');
            $t->string('fiscal_identity')->nullable()->unique();
        });

        DB::transaction(function () {
            $this->consolidateCarts();
            $users = DB::table('direccion_usuario')->where('principal', true)->select('usuario_id')->groupBy('usuario_id')->havingRaw('COUNT(*) > 1')->pluck('usuario_id');
            foreach ($users as $user) {
                $ids = DB::table('direccion_usuario')->where('usuario_id', $user)->where('principal', true)->orderByDesc('updated_at')->orderByDesc('id')->pluck('id');
                DB::table('direccion_usuario')->whereIn('id', $ids->slice(1))->update(['principal' => false]);
                $this->record('principal-address:'.$user, 'primary_address', ['kept_id' => $ids->first(), 'demoted_ids' => $ids->slice(1)->values()->all(), 'criterion' => 'latest_updated_then_highest_id']);
            }

            // Preserve every fiscal document and its recorded provider state. Demo identities
            // intentionally do not participate in the uniqueness of live fiscal numbering.
            $demoOrders = DB::table('pedido')->whereNotNull('seed_batch')->select('id');
            DB::table('comprobantes')->whereIn('pedido_id', $demoOrders)->update(['fiscal_environment' => 'demo']);
            DB::table('comprobantes')->where('fiscal_environment', '!=', 'demo')->orderBy('id')->get()->each(function ($receipt) {
                $environment = config('invoicing.environment', 'sandbox');
                $issuer = (string) config('invoicing.company.ruc', 'unconfigured');
                $identity = $receipt->serie && $receipt->numero ? implode(':', [$environment, $issuer, $receipt->tipo, $receipt->serie, $receipt->numero]) : null;
                DB::table('comprobantes')->where('id', $receipt->id)->update(['fiscal_environment' => $environment, 'issuer_tax_id' => $issuer, 'fiscal_identity' => $identity]);
            });

            // A recorded single legacy method and the sale total are the source of this
            // representation repair. This does not assert bank settlement or cash closure.
            $sales = DB::table('ventas_pos as v')->whereNotNull('metodo_pago_id')
                ->whereNotExists(fn ($q) => $q->selectRaw('1')->from('venta_pos_pagos as p')->whereColumn('p.venta_pos_id', 'v.id'))->get(['v.id', 'v.metodo_pago_id', 'v.total']);
            foreach ($sales as $sale) {
                DB::table('venta_pos_pagos')->insert(['venta_pos_id' => $sale->id, 'metodo_pago_id' => $sale->metodo_pago_id, 'monto' => $sale->total, 'created_at' => now(), 'updated_at' => now()]);
                $this->record('legacy-pos-payment:'.$sale->id, 'legacy_payment_representation', ['sale_id' => $sale->id, 'amount' => $sale->total, 'method_id' => $sale->metodo_pago_id, 'settlement_verified' => false]);
            }

            // Explicit opening anchor; legacy movements remain accessible as historical
            // evidence and are not replayed against the physical stock a second time.
            foreach (DB::table('stock_almacen')->orderBy('id')->cursor() as $stock) {
                DB::table('inventario_movimientos')->insert(['variante_id' => $stock->variante_id, 'almacen_id' => $stock->almacen_id, 'usuario_id' => null,
                    'tipo' => 'apertura', 'cantidad' => $stock->cantidad, 'stock_anterior' => 0, 'stock_nuevo' => $stock->cantidad,
                    'motivo' => 'Saldo de apertura de migración; no representa conteo físico ni recepción', 'operation_key' => 'opening:'.$stock->almacen_id.':'.$stock->variante_id,
                    'created_at' => now(), 'updated_at' => now()]);
            }
            $this->record('inventory-opening-v1', 'inventory_opening', ['source' => 'stock_almacen', 'physical_count_verified' => false]);
        });

        foreach (['pago' => ['pedido_id'], 'envio' => ['pedido_id'], 'carrito' => ['usuario_id'], 'carrito_item' => ['carrito_id', 'variante_id'],
            'resenas' => ['producto_id', 'usuario_id'], 'usuario_rol' => ['usuario_id', 'rol_id'], 'rol_permiso' => ['rol_id', 'permiso_id'], 'rol' => ['nombre']] as $table => $columns) {
            if (DB::table($table)->select($columns)->groupBy($columns)->havingRaw('COUNT(*) > 1')
                ->whereNotNull($columns[0])->exists()) {
                throw new RuntimeException('Duplicados pendientes en '.$table.'. No se elimina historial financiero automáticamente.');
            }
            Schema::table($table, fn (Blueprint $t) => $t->unique($columns, 'integrity_'.$table.'_unique'));
        }

        $references = [
            ['rma_requests', 'pedido_id', 'pedido', true], ['rma_requests', 'producto_id', 'producto', true],
            ['pedido_item', 'almacen_id', 'almacenes', true], ['storefront_tasks', 'pedido_id', 'pedido', true],
            ['refund_requests', 'pedido_id', 'pedido', false], ['refund_requests', 'rma_id', 'rma_requests', true],
            ['refund_requests', 'requested_by', 'usuario', false], ['refund_requests', 'confirmed_by', 'usuario', true],
            ['loyalty_order_ledger', 'pedido_id', 'pedido', false], ['loyalty_order_ledger', 'usuario_id', 'usuario', false],
            ['payment_resolution_events', 'reconciliation_id', 'payment_reconciliations', false], ['payment_resolution_events', 'actor_id', 'usuario', false],
            ['inventory_returns', 'almacen_id', 'almacenes', false], ['inventory_returns', 'usuario_id', 'usuario', true],
            ['marketing_deliveries', 'usuario_id', 'usuario', false], ['checkout_benefit_reservations', 'usuario_id', 'usuario', true],
            ['checkout_benefit_reservations', 'cupon_id', 'cupones', true], ['movimientos_almacen', 'usuario_id', 'usuario', true],
            ['historial_precio', 'usuario_id', 'usuario', true],
        ];
        foreach ($references as [$table, $column, $parent, $nullable]) {
            $this->addReference($table, $column, $parent, $nullable);
        }
        foreach (['inventario_movimientos', 'movimientos_almacen'] as $table) {
            $this->restrictHistory($table, 'variante_id', 'variante');
        }
        $this->restrictHistory('inventario_movimientos', 'almacen_id', 'almacenes');

        // Conditional keys allow many non-primary addresses / closed sessions.
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::statement('ALTER TABLE direccion_usuario ADD COLUMN principal_usuario_id BIGINT GENERATED ALWAYS AS (CASE WHEN principal = 1 THEN usuario_id ELSE NULL END) VIRTUAL, ADD UNIQUE KEY address_one_primary (principal_usuario_id)');
            DB::statement("ALTER TABLE cajas_sesiones ADD COLUMN active_cashier_id BIGINT GENERATED ALWAYS AS (CASE WHEN estado = 'abierta' THEN cajero_id ELSE NULL END) VIRTUAL, ADD UNIQUE KEY register_one_open_cashier (active_cashier_id), ADD COLUMN active_register_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN estado = 'abierta' THEN caja_id ELSE NULL END) VIRTUAL, ADD UNIQUE KEY register_one_open_register (active_register_id)");
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        } else {
            DB::statement('CREATE UNIQUE INDEX address_one_primary ON direccion_usuario(usuario_id) WHERE principal = 1');
            DB::statement("CREATE UNIQUE INDEX register_one_open_cashier ON cajas_sesiones(cajero_id) WHERE estado = 'abierta'");
            DB::statement("CREATE UNIQUE INDEX register_one_open_register ON cajas_sesiones(caja_id) WHERE estado = 'abierta'");
        }
        foreach ([['stock_almacen', 'stock_nonnegative', 'cantidad >= 0'], ['variante', 'variant_nonnegative', 'stock >= 0 AND precio >= 0 AND precio_compra >= 0'],
            ['pedido_item', 'order_item_positive', 'cantidad > 0 AND precio_unitario >= 0'], ['carrito_item', 'cart_item_positive', 'cantidad > 0'],
            ['resenas', 'review_rating_range', 'calificacion BETWEEN 1 AND 5'], ['venta_pos_items', 'pos_item_positive', 'cantidad > 0 AND precio_unitario >= 0'],
            ['compra_items', 'purchase_item_positive', 'cantidad > 0 AND costo_unitario >= 0'], ['refund_requests', 'refund_positive', 'amount > 0'] ] as [$table, $name, $condition]) {
            $this->check($table, $name, $condition);
        }
    }

    private function record(string $key, string $kind, array $details): void
    {
        DB::table('database_repair_events')->insert(['operation_key' => $key, 'kind' => $kind, 'details' => json_encode($details, JSON_THROW_ON_ERROR), 'created_at' => now()]);
    }

    private function consolidateCarts(): void
    {
        $users = DB::table('carrito')->whereNotNull('usuario_id')->select('usuario_id')->groupBy('usuario_id')->havingRaw('COUNT(*) > 1')->pluck('usuario_id');
        foreach ($users as $user) {
            $ids = DB::table('carrito')->where('usuario_id', $user)->orderBy('id')->pluck('id');
            $items = DB::table('carrito_item')->whereIn('carrito_id', $ids)->get();
            foreach ($items->groupBy('variante_id') as $variant => $rows) {
                $keep = $rows->first();
                DB::table('carrito_item')->whereIn('id', $rows->pluck('id')->slice(1))->delete();
                DB::table('carrito_item')->where('id', $keep->id)->update(['carrito_id' => $ids->first(), 'cantidad' => min(5, $rows->sum('cantidad'))]);
            }
            DB::table('carrito')->whereIn('id', $ids->slice(1))->delete();
            $this->record('merge-cart:'.$user, 'cart_consolidation', ['kept_id' => $ids->first(), 'merged_ids' => $ids->slice(1)->values()->all(), 'original_items' => $items->map(fn ($i) => ['id' => $i->id, 'variant_id' => $i->variante_id, 'quantity' => $i->cantidad])->all()]);
        }
    }

    private function addReference(string $table, string $column, string $parent, bool $nullable): void
    {
        $existing = collect(Schema::getForeignKeys($table))->first(fn ($fk) => in_array($column, $fk['columns'], true));
        if ($existing) return;
        if (DB::table($table.' as child')->leftJoin($parent.' as parent', 'child.'.$column, '=', 'parent.id')
            ->whereNotNull('child.'.$column)->whereNull('parent.id')->exists()) {
            throw new RuntimeException('Referencia huérfana en '.$table.'.'.$column);
        }
        $parentType = collect(Schema::getColumns($parent))->firstWhere('name', 'id')['type'];
        $unsigned = str_contains(strtolower($parentType), 'unsigned');
        Schema::table($table, function (Blueprint $t) use ($column, $nullable, $unsigned, $parent, $table) {
            $t->bigInteger($column)->unsigned($unsigned)->nullable($nullable)->change();
            $t->foreign($column, 'integrity_'.$table.'_'.$column.'_fk')->references('id')->on($parent)->restrictOnDelete();
        });
    }

    private function restrictHistory(string $table, string $column, string $parent): void
    {
        $foreign = collect(Schema::getForeignKeys($table))->first(fn ($fk) => in_array($column, $fk['columns'], true));
        if ($foreign) Schema::table($table, fn (Blueprint $t) => $t->dropForeign(DB::getDriverName() === 'sqlite' ? [$column] : $foreign['name']));
        Schema::table($table, fn (Blueprint $t) => $t->foreign($column)->references('id')->on($parent)->restrictOnDelete());
    }

    private function check(string $table, string $name, string $condition): void
    {
        if (DB::table($table)->whereRaw('NOT ('.$condition.')')->exists()) throw new RuntimeException('Regla violada: '.$name);
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `'.$table.'` ADD CONSTRAINT `'.$name.'` CHECK ('.$condition.')');
        } else {
            // SQLite cannot add CHECK to an existing table. Enforce the same invariant
            // on insert/update so fresh test databases exercise domain protection.
            $expression = preg_replace_callback('/\b(cantidad|stock|precio|precio_compra|precio_unitario|calificacion|costo_unitario|amount)\b/', fn ($m) => 'NEW.'.$m[0], $condition);
            foreach (['INSERT', 'UPDATE'] as $event) DB::statement('CREATE TRIGGER '.$name.'_'.strtolower($event).' BEFORE '.$event.' ON '.$table.' WHEN NOT ('.$expression.") BEGIN SELECT RAISE(ABORT, '".$name."'); END");
        }
    }

    public function down(): void
    {
        throw new RuntimeException('La consolidación de históricos no se revierte eliminando datos. Utiliza el respaldo verificado y una migración correctiva.');
    }
};
