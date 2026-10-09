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
        Schema::table('variante', function (Blueprint $table) {
            if (!Schema::hasColumn('variante', 'precio_compra')) {
                $table->decimal('precio_compra', 10, 2)->nullable()->after('precio');
            }
            if (!Schema::hasColumn('variante', 'stock_minimo')) {
                $table->integer('stock_minimo')->default(5)->after('stock_reservado');
            }
            if (!Schema::hasColumn('variante', 'stock_maximo')) {
                $table->integer('stock_maximo')->default(100)->after('stock_minimo');
            }
            if (!Schema::hasColumn('variante', 'stock_seguridad')) {
                $table->integer('stock_seguridad')->default(10)->after('stock_maximo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('variante', function (Blueprint $table) {
            $table->dropColumn(['precio_compra', 'stock_minimo', 'stock_maximo', 'stock_seguridad']);
        });
    }
};
