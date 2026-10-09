<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->string('rfm_score', 10)->nullable();
            $table->decimal('ltv', 10, 2)->default(0);
            $table->dateTime('last_order_date')->nullable();
            $table->integer('total_orders')->default(0);
            $table->string('segmento', 50)->default('Nuevo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->dropColumn(['rfm_score', 'ltv', 'last_order_date', 'total_orders', 'segmento']);
        });
    }
};
