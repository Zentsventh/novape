<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transacciones_pago', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('pedido_id')->nullable();
            $table->string('payment_intent_id')->nullable();
            $table->string('pasarela')->default('stripe');
            $table->decimal('monto', 10, 2);
            $table->string('estado')->default('pendiente'); // pendiente, exitoso, fallido
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->foreign('pedido_id')->references('id')->on('pedido')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transacciones_pago');
    }
};
