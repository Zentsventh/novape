<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comprobantes', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('pedido_id')->nullable();
            $table->string('tipo', 20)->default('boleta'); // boleta, factura, nota_venta
            $table->string('serie', 10)->nullable();
            $table->string('numero', 20)->nullable();
            $table->string('codigo_ticket', 50)->nullable()->unique();
            $table->string('ruta_pdf')->nullable();
            $table->string('ruta_xml')->nullable();
            $table->string('estado_sunat', 30)->default('pendiente'); // pendiente, aceptado, rechazado
            $table->string('hash_cdr')->nullable();
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('igv', 12, 2)->default(0);
            $table->decimal('operaciones_gravadas', 12, 2)->default(0);
            $table->string('cliente_nombre')->nullable();
            $table->string('cliente_documento', 20)->nullable();
            $table->string('cliente_tipo_documento', 10)->default('DNI');
            $table->timestamp('emitido_at')->nullable();
            $table->timestamps();

            $table->foreign('pedido_id')->references('id')->on('pedido')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobantes');
    }
};
