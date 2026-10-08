<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('variante', function (Blueprint $table) {
            $table->decimal('shipping_length_cm', 10, 2)->nullable();
            $table->decimal('shipping_width_cm', 10, 2)->nullable();
            $table->decimal('shipping_height_cm', 10, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('variante', fn (Blueprint $table) => $table->dropColumn(['shipping_length_cm', 'shipping_width_cm', 'shipping_height_cm']));
    }
};
