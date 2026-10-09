<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Compra Items (detalle de cada compra)
        Schema::create('compra_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained('compras')->cascadeOnDelete();
            $table->bigInteger('producto_id')->nullable();
            $table->bigInteger('variante_id')->nullable();
            $table->integer('cantidad')->default(1);
            $table->decimal('costo_unitario', 10, 2)->default(0);
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->timestamps();
            $table->foreign('producto_id')->references('id')->on('producto')->nullOnDelete();
            $table->foreign('variante_id')->references('id')->on('variante')->nullOnDelete();
        });

        // 2. Movimientos de Almacén (Kardex)
        Schema::create('movimientos_almacen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes')->cascadeOnDelete();
            $table->bigInteger('variante_id');
            $table->enum('tipo', ['entrada', 'salida', 'transferencia', 'ajuste']);
            $table->integer('cantidad');
            $table->string('referencia')->nullable();
            $table->unsignedBigInteger('almacen_destino_id')->nullable();
            $table->bigInteger('usuario_id')->nullable();
            $table->timestamps();
            $table->foreign('variante_id')->references('id')->on('variante')->cascadeOnDelete();
            $table->foreign('almacen_destino_id')->references('id')->on('almacenes')->nullOnDelete();
        });

        // 3. Stock por Almacén (inventario distribuido)
        Schema::create('stock_almacen', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')->constrained('almacenes')->cascadeOnDelete();
            $table->bigInteger('variante_id');
            $table->integer('cantidad')->default(0);
            $table->timestamps();
            $table->unique(['almacen_id', 'variante_id']);
            $table->foreign('variante_id')->references('id')->on('variante')->cascadeOnDelete();
        });

        // 4. Banners CMS
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->string('subtitulo')->nullable();
            $table->string('imagen_url', 500);
            $table->string('enlace_url', 500)->nullable();
            $table->string('posicion', 50)->default('hero');
            $table->integer('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->timestamps();
        });

        // 5. Ventas POS (tickets de caja)
        Schema::create('ventas_pos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_ticket', 50)->unique();
            $table->bigInteger('cajero_id')->nullable();
            $table->foreignId('metodo_pago_id')->nullable()->constrained('metodos_pago')->nullOnDelete();
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('igv', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->enum('tipo_comprobante', ['boleta', 'factura'])->default('boleta');
            $table->timestamps();
            $table->foreign('cajero_id')->references('id')->on('usuario')->nullOnDelete();
        });

        // 6. Items de Venta POS
        Schema::create('venta_pos_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_pos_id')->constrained('ventas_pos')->cascadeOnDelete();
            $table->bigInteger('variante_id')->nullable();
            $table->string('producto_nombre');
            $table->integer('cantidad')->default(1);
            $table->decimal('precio_unitario', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
            $table->foreign('variante_id')->references('id')->on('variante')->nullOnDelete();
        });

        // 7. Columnas faltantes en tablas existentes
        if (Schema::hasTable('producto')) {
            if (!Schema::hasColumn('producto', 'retiro_tienda')) {
                Schema::table('producto', function (Blueprint $table) {
                    $table->boolean('retiro_tienda')->default(true)->after('activo');
                    $table->boolean('envio_domicilio')->default(true)->after('retiro_tienda');
                });
            }
        }

        if (Schema::hasTable('gastos')) {
            if (!Schema::hasColumn('gastos', 'tipo')) {
                Schema::table('gastos', function (Blueprint $table) {
                    $table->enum('tipo', ['fijo', 'variable'])->default('variable')->after('categoria');
                });
            }
        }

        if (Schema::hasTable('compras')) {
            if (!Schema::hasColumn('compras', 'numero_orden')) {
                Schema::table('compras', function (Blueprint $table) {
                    $table->string('numero_orden', 50)->nullable()->after('id');
                    $table->text('notas')->nullable()->after('estado');
                });
            }
        }

        if (Schema::hasTable('proveedor')) {
            if (!Schema::hasColumn('proveedor', 'condiciones_credito')) {
                Schema::table('proveedor', function (Blueprint $table) {
                    $table->text('condiciones_credito')->nullable();
                    $table->integer('lead_time_dias')->default(7);
                });
            }
        }

        if (Schema::hasTable('zonas')) {
            if (!Schema::hasColumn('zonas', 'descripcion')) {
                Schema::table('zonas', function (Blueprint $table) {
                    $table->text('descripcion')->nullable()->after('nombre');
                });
            }
        }

        if (Schema::hasTable('metodos_pago')) {
            if (!Schema::hasColumn('metodos_pago', 'tipo')) {
                Schema::table('metodos_pago', function (Blueprint $table) {
                    $table->enum('tipo', ['digital', 'fisico', 'transferencia'])->default('digital')->after('detalles');
                    $table->decimal('comision_porcentaje', 5, 2)->default(0)->after('tipo');
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('venta_pos_items');
        Schema::dropIfExists('ventas_pos');
        Schema::dropIfExists('banners');
        Schema::dropIfExists('stock_almacen');
        Schema::dropIfExists('movimientos_almacen');
        Schema::dropIfExists('compra_items');
    }
};
