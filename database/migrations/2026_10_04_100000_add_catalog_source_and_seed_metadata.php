<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->text('fuente_url')->nullable();
            $table->date('fuente_consultada_at')->nullable();
        });
        Schema::table('variante', function (Blueprint $table) {
            $table->decimal('precio_anterior', 10, 2)->nullable();
        });
        foreach (['usuario', 'clientes', 'pedido', 'ventas_pos', 'compras', 'gastos', 'crm_companies'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('seed_batch', 80)->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        foreach (['usuario', 'clientes', 'pedido', 'ventas_pos', 'compras', 'gastos', 'crm_companies'] as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropColumn('seed_batch'));
        }
        Schema::table('variante', fn (Blueprint $table) => $table->dropColumn('precio_anterior'));
        Schema::table('producto', fn (Blueprint $table) => $table->dropColumn(['fuente_url', 'fuente_consultada_at']));
    }
};
