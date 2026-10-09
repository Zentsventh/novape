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
            $table->string('comprobante_tipo', 20)->nullable()->after('estado')->comment('Boleta o Factura');
            $table->string('comprobante_serie', 10)->nullable()->after('comprobante_tipo');
            $table->string('comprobante_correlativo', 20)->nullable()->after('comprobante_serie');
            $table->string('enlace_pdf', 255)->nullable()->after('comprobante_correlativo');
            $table->string('enlace_xml', 255)->nullable()->after('enlace_pdf');
            $table->boolean('facturado_sunat')->default(false)->after('enlace_xml');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedido', function (Blueprint $table) {
            $table->dropColumn([
                'comprobante_tipo',
                'comprobante_serie',
                'comprobante_correlativo',
                'enlace_pdf',
                'enlace_xml',
                'facturado_sunat'
            ]);
        });
    }
};
