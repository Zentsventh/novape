<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('envio', function (Blueprint $table) {
            $table->string('proveedor')->nullable()->after('estado'); // Ej. shippo, olva, dhl
            $table->string('rate_id')->nullable()->after('proveedor');
            $table->string('transaction_id')->nullable()->after('tracking');
            $table->string('label_url')->nullable()->after('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('envio', function (Blueprint $table) {
            $table->dropColumn(['proveedor', 'rate_id', 'transaction_id', 'label_url']);
        });
    }
};
