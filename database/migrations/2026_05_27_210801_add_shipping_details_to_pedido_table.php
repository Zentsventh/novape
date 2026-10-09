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
        Schema::table('pedido', function (Blueprint $table) {
            $table->string('tracking_number', 100)->nullable()->after('estado');
            $table->string('courier_name', 100)->nullable()->after('tracking_number');
            $table->decimal('costo_envio', 10, 2)->default(0)->after('descuento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedido', function (Blueprint $table) {
            $table->dropColumn(['tracking_number', 'courier_name', 'costo_envio']);
        });
    }
};
