<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('transacciones_pago')) {
            if (Schema::hasColumn('transacciones_pago', 'payment_intent_id')) {
                Schema::table('transacciones_pago', function (Blueprint $table) {
                    $table->renameColumn('payment_intent_id', 'referencia_pasarela');
                });
            }

            Schema::table('transacciones_pago', function (Blueprint $table) {
                $table->string('pasarela')->default('niubiz')->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('transacciones_pago') && Schema::hasColumn('transacciones_pago', 'referencia_pasarela')) {
            Schema::table('transacciones_pago', function (Blueprint $table) {
                $table->renameColumn('referencia_pasarela', 'payment_intent_id');
            });
        }
    }
};
