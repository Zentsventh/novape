<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['gastos', 'proveedor'] as $table) Schema::table($table, fn (Blueprint $t) => $t->softDeletes());
        Schema::create('operation_events', function (Blueprint $t) {
            $t->id(); $t->string('event'); $t->string('source_table'); $t->unsignedBigInteger('source_id')->nullable();
            $t->bigInteger('actor_id')->nullable(); $t->string('actor_type')->default('system');
            $t->string('correlation_id', 100)->nullable(); $t->json('details'); $t->timestamp('created_at');
            $t->foreign('actor_id')->references('id')->on('usuario')->restrictOnDelete();
            $t->index(['source_table', 'source_id', 'created_at'], 'operations_source_idx');
        });
        Schema::table('clientes', fn (Blueprint $t) => $t->unique(['tipo_documento', 'numero_documento'], 'client_document_unique'));
        Schema::table('gastos', fn (Blueprint $t) => $t->index(['fecha_gasto', 'deleted_at'], 'expense_business_date_idx'));
        Schema::table('compra_items', fn (Blueprint $t) => $t->decimal('costo_unitario', 14, 4)->change());
        foreach (['pago', 'refund_requests'] as $table) Schema::table($table, fn (Blueprint $t) => $t->char('currency', 3)->default('PEN'));
        if (Schema::hasColumn('usuario', 'seed_batch')) {
            foreach (DB::table('clientes')->whereNull('usuario_id')->orderBy('id')->cursor() as $client) {
                $users = DB::table('usuario')->whereNull('deleted_at')->where('dni', trim($client->numero_documento))
                    ->where('tipo_documento', strtoupper(trim($client->tipo_documento)))->pluck('id');
                if ($users->count() === 1 && !DB::table('clientes')->where('usuario_id', $users->first())->exists()) {
                    DB::table('clientes')->where('id', $client->id)->update(['usuario_id' => $users->first()]);
                }
            }
        }
    }

    public function down(): void
    {
        throw new RuntimeException('Conserva eventos e identidades mediante una migración correctiva; no borres el historial para revertir.');
    }
};
