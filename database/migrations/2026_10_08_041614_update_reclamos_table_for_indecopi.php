<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reclamos', function (Blueprint $table) {
            $table->string('direccion')->nullable()->after('email');
            $table->boolean('menor_edad')->default(false)->after('direccion');
            $table->string('nombre_apoderado')->nullable()->after('menor_edad');
            $table->string('bien_contratado')->nullable()->comment('Producto / Servicio')->after('nombre_apoderado');
            $table->decimal('monto_reclamado', 10, 2)->nullable()->after('bien_contratado');
            $table->string('pedido_relacionado')->nullable()->after('monto_reclamado');
            $table->text('pedido_consumidor')->nullable()->after('detalle');
        });
    }

    public function down(): void
    {
        Schema::table('reclamos', function (Blueprint $table) {
            $table->dropColumn([
                'direccion',
                'menor_edad',
                'nombre_apoderado',
                'bien_contratado',
                'monto_reclamado',
                'pedido_relacionado',
                'pedido_consumidor',
            ]);
        });
    }
};
