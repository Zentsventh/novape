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
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('tipo_documento', 20)->default('DNI');
            $table->string('numero_documento', 20)->unique();
            $table->string('nombre_razon_social', 255);
            $table->string('direccion', 500)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('correo', 150)->nullable();
            $table->timestamps();
        });

        Schema::table('ventas_pos', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable()->after('codigo_ticket');
            $table->foreign('cliente_id')->references('id')->on('clientes')->nullOnDelete();
        });

        // Use raw SQL to alter the enum safely
        try {
            DB::statement("ALTER TABLE ventas_pos MODIFY COLUMN tipo_comprobante ENUM('ticket', 'boleta', 'factura') NOT NULL DEFAULT 'ticket'");
        } catch (\Exception $e) {
            // Ignore in SQLite
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        try {
            DB::statement("ALTER TABLE ventas_pos MODIFY COLUMN tipo_comprobante ENUM('boleta', 'factura') NOT NULL DEFAULT 'boleta'");
        } catch (\Exception $e) {
            // Ignore in SQLite
        }

        Schema::table('ventas_pos', function (Blueprint $table) {
            $table->dropForeign(['cliente_id']);
            $table->dropColumn('cliente_id');
        });

        Schema::dropIfExists('clientes');
    }
};
