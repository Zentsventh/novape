<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storefront_tasks', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('pedido_id')->nullable()->index();
            $t->string('kind'); $t->string('dedup_key')->unique(); $t->string('destination')->nullable();
            $t->json('payload'); $t->string('status')->default('pending')->index();
            $t->unsignedInteger('attempts')->default(0); $t->timestamp('available_at')->nullable()->index();
            $t->timestamp('started_at')->nullable(); $t->text('error')->nullable(); $t->timestamps();
        });
        Schema::create('payment_resolution_events', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('reconciliation_id')->index(); $t->unsignedBigInteger('actor_id');
            $t->string('result'); $t->decimal('amount', 14, 2); $t->string('provider_reference');
            $t->text('evidence'); $t->timestamp('created_at');
        });
        Schema::create('loyalty_order_ledger', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('pedido_id')->unique(); $t->unsignedBigInteger('usuario_id');
            $t->integer('earned_points'); $t->integer('reversed_points')->default(0); $t->timestamp('reversed_at')->nullable(); $t->timestamps();
        });
        Schema::create('refund_requests', function (Blueprint $t) {
            $t->id(); $t->unsignedBigInteger('pedido_id')->index(); $t->unsignedBigInteger('rma_id')->nullable()->unique();
            $t->uuid('request_key')->unique(); $t->decimal('amount', 14, 2); $t->string('status')->index();
            $t->unsignedBigInteger('requested_by'); $t->unsignedBigInteger('confirmed_by')->nullable();
            $t->string('provider_reference')->nullable()->unique(); $t->text('evidence')->nullable();
            $t->timestamp('confirmed_at')->nullable(); $t->timestamps();
        });
    }

    public function down(): void
    {
        // Operational evidence must not be deleted by a routine rollback.
        throw new RuntimeException('Esta migración contiene evidencia operativa; utiliza un respaldo verificado para revertirla.');
    }
};
