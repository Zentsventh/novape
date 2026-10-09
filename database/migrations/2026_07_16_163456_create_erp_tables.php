<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Zonas de Envío
        Schema::create('zonas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->decimal('costo_envio', 10, 2)->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 2. Métodos de Pago
        Schema::create('metodos_pago', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Ej: Yape, Plin, Tarjeta, Efectivo
            $table->text('detalles')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 3. Almacenes
        Schema::create('almacenes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('direccion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 4. Compras a Proveedores
        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proveedor_id')->nullable()->constrained('proveedor')->nullOnDelete();
            $table->decimal('total', 10, 2)->default(0);
            $table->string('estado')->default('completado'); // pendiente, completado, cancelado
            $table->date('fecha_compra');
            $table->timestamps();
        });

        // 5. Gastos Operativos (Luz, Agua, Sueldos, etc)
        Schema::create('gastos', function (Blueprint $table) {
            $table->id();
            $table->string('concepto');
            $table->decimal('monto', 10, 2);
            $table->string('categoria')->default('operativo');
            $table->date('fecha_gasto');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gastos');
        Schema::dropIfExists('compras');
        Schema::dropIfExists('almacenes');
        Schema::dropIfExists('metodos_pago');
        Schema::dropIfExists('zonas');
    }
};
