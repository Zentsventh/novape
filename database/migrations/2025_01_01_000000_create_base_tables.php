<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // usuario
        if (!Schema::hasTable('usuario')) {
            Schema::create('usuario', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->string('nombres', 100);
                $table->string('apellidos', 100);
                $table->string('email', 100)->unique();
                $table->string('telefono', 20)->nullable();
                $table->string('password_hash', 255);
                $table->string('estado', 20)->default('activo');
                $table->timestamps();
            });
        }

        // rol
        if (!Schema::hasTable('rol')) {
            Schema::create('rol', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->string('nombre', 50);
                $table->string('descripcion', 255)->nullable();
                $table->timestamps();
            });
        }

        // usuario_rol
        if (!Schema::hasTable('usuario_rol')) {
            Schema::create('usuario_rol', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('usuario_id');
                $table->bigInteger('rol_id');
                $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
                $table->foreign('rol_id')->references('id')->on('rol')->onDelete('cascade');
                $table->timestamps();
            });
        }

        // direccion_usuario
        if (!Schema::hasTable('direccion_usuario')) {
            Schema::create('direccion_usuario', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('usuario_id');
                $table->string('direccion', 255);
                $table->string('referencia', 255)->nullable();
                $table->string('departamento', 100)->nullable();
                $table->string('provincia', 100)->nullable();
                $table->string('distrito', 100)->nullable();
                $table->string('codigo_postal', 20)->nullable();
                $table->timestamps();

                $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
            });
        }

        // carrito
        if (!Schema::hasTable('carrito')) {
            Schema::create('carrito', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('usuario_id')->nullable();
                $table->string('session_id', 100)->nullable();
                $table->timestamps();

                $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
            });
        }

        // marca
        if (!Schema::hasTable('marca')) {
            Schema::create('marca', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->string('nombre', 100);
                $table->timestamps();
            });
        }


        // categoria
        if (!Schema::hasTable('categoria')) {
            Schema::create('categoria', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->string('nombre', 100);
                $table->text('descripcion')->nullable();
                $table->string('slug', 150)->unique()->nullable();
                $table->boolean('activa')->default(true);
                $table->bigInteger('categoria_padre_id')->nullable();
                $table->foreign('categoria_padre_id')->references('id')->on('categoria')->onDelete('set null');
                $table->timestamps();
            });
        }

        // producto
        if (!Schema::hasTable('producto')) {
            Schema::create('producto', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('marca_id')->nullable();
                $table->string('nombre', 255);
                $table->text('descripcion')->nullable();
                $table->string('sku_base', 100)->unique();
                $table->boolean('activo')->default(true);
                $table->softDeletes();
                $table->timestamps();

                $table->foreign('marca_id')->references('id')->on('marca')->onDelete('set null');
            });
        }

        // producto_categoria
        if (!Schema::hasTable('producto_categoria')) {
            Schema::create('producto_categoria', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('producto_id');
                $table->bigInteger('categoria_id');
                $table->foreign('producto_id')->references('id')->on('producto')->onDelete('cascade');
                $table->foreign('categoria_id')->references('id')->on('categoria')->onDelete('cascade');
            });
        }

        // variante
        if (!Schema::hasTable('variante')) {
            Schema::create('variante', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('producto_id');
                $table->string('sku', 100)->unique();
                $table->decimal('precio', 10, 2);
                $table->json('atributos')->nullable();
                $table->decimal('peso', 8, 2)->nullable();
                $table->integer('stock')->default(0);
                $table->integer('stock_reservado')->default(0);
                $table->boolean('activo')->default(true);
                $table->timestamps();

                $table->foreign('producto_id')->references('id')->on('producto')->onDelete('cascade');
            });
        }

        // carrito_item
        if (!Schema::hasTable('carrito_item')) {
            Schema::create('carrito_item', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('carrito_id');
                $table->bigInteger('variante_id');
                $table->integer('cantidad')->default(1);
                $table->timestamps();

                $table->foreign('carrito_id')->references('id')->on('carrito')->onDelete('cascade');
                $table->foreign('variante_id')->references('id')->on('variante')->onDelete('cascade');
            });
        }

        // producto_imagen
        if (!Schema::hasTable('producto_imagen')) {
            Schema::create('producto_imagen', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('producto_id');
                $table->string('url', 255);
                $table->integer('orden')->default(0);
                $table->timestamps();

                $table->foreign('producto_id')->references('id')->on('producto')->onDelete('cascade');
            });
        }


        // pedido
        if (!Schema::hasTable('pedido')) {
            Schema::create('pedido', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('usuario_id')->nullable();
                $table->string('codigo', 50)->unique();
                $table->decimal('subtotal', 10, 2);
                $table->decimal('descuento', 10, 2)->default(0);
                $table->decimal('total', 10, 2);
                $table->string('estado', 50)->default('pendiente');
                $table->timestamps();

                $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('set null');
            });
        }

        // pedido_item
        if (!Schema::hasTable('pedido_item')) {
            Schema::create('pedido_item', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('pedido_id');
                $table->bigInteger('variante_id')->nullable();
                $table->integer('cantidad');
                $table->decimal('precio_unitario', 10, 2);
                $table->timestamps();

                $table->foreign('pedido_id')->references('id')->on('pedido')->onDelete('cascade');
                $table->foreign('variante_id')->references('id')->on('variante')->onDelete('set null');
            });
        }


        // envio
        if (!Schema::hasTable('envio')) {
            Schema::create('envio', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('pedido_id');
                $table->bigInteger('direccion_id')->nullable();
                $table->string('estado', 50)->default('preparando');
                $table->string('tracking', 100)->nullable();
                $table->timestamps();

                $table->foreign('pedido_id')->references('id')->on('pedido')->onDelete('cascade');
                $table->foreign('direccion_id')->references('id')->on('direccion_usuario')->onDelete('set null');
            });
        }

        // historial_precio
        if (!Schema::hasTable('historial_precio')) {
            Schema::create('historial_precio', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('variante_id');
                $table->decimal('precio', 10, 2);
                $table->timestamp('fecha_inicio');
                $table->timestamp('fecha_fin')->nullable();
                $table->timestamps();

                $table->foreign('variante_id')->references('id')->on('variante')->onDelete('cascade');
            });
        }

        // pago
        if (!Schema::hasTable('pago')) {
            Schema::create('pago', function (Blueprint $table) {
                $table->bigInteger('id', true);
                $table->bigInteger('pedido_id');
                $table->string('metodo', 50);
                $table->string('estado', 50)->default('pendiente');
                $table->decimal('monto', 10, 2);
                $table->timestamps();

                $table->foreign('pedido_id')->references('id')->on('pedido')->onDelete('cascade');
            });
        }

    }

    public function down(): void
    {
        Schema::dropIfExists('pago');
        Schema::dropIfExists('historial_precio');
        Schema::dropIfExists('envio');
        Schema::dropIfExists('pedido_item');
        Schema::dropIfExists('pedido');
        Schema::dropIfExists('producto_imagen');
        Schema::dropIfExists('variante');
        Schema::dropIfExists('producto_categoria');
        Schema::dropIfExists('producto');
        Schema::dropIfExists('categoria');
        Schema::dropIfExists('marca');
        Schema::dropIfExists('usuario_rol');
        Schema::dropIfExists('rol');
        Schema::dropIfExists('usuario');
    }
};
