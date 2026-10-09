<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('comprobantes_series')) {
            Schema::create('comprobantes_series', function (Blueprint $table) {
                $table->id();
                $table->string('tipo_comprobante'); // boleta, factura, ticket
                $table->string('serie'); // B001, F001, T001
                $table->integer('correlativo_actual')->default(0);
                $table->boolean('activo')->default(true);
                $table->timestamps();
            });

            // Insert initial series
            DB::table('comprobantes_series')->insert([
                ['tipo_comprobante' => 'boleta', 'serie' => 'B001', 'correlativo_actual' => 0, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
                ['tipo_comprobante' => 'factura', 'serie' => 'F001', 'correlativo_actual' => 0, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
                ['tipo_comprobante' => 'ticket', 'serie' => 'T001', 'correlativo_actual' => 0, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (!Schema::hasTable('caja_movimientos')) {
            Schema::create('caja_movimientos', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('caja_sesion_id');
                $table->bigInteger('usuario_id');
                
                $table->foreign('caja_sesion_id')->references('id')->on('cajas_sesiones')->onDelete('cascade');
                $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
                
                $table->enum('tipo', ['ingreso', 'egreso']);
                $table->decimal('monto', 10, 2);
                $table->string('concepto');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('caja_movimientos');
        Schema::dropIfExists('comprobantes_series');
    }
};
