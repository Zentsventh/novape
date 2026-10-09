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
        if (!Schema::hasColumn('variante', 'deleted_at')) {
            Schema::table('variante', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (!Schema::hasColumn('categoria', 'deleted_at')) {
            Schema::table('categoria', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (!Schema::hasColumn('pedido', 'direccion_envio_snapshot')) {
            Schema::table('pedido', function (Blueprint $table) {
                $table->json('direccion_envio_snapshot')->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('pedido', 'direccion_envio_snapshot')) {
            Schema::table('pedido', function (Blueprint $table) {
                $table->dropColumn('direccion_envio_snapshot');
            });
        }
    }
};
