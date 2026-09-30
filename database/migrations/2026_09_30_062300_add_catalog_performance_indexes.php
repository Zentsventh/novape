<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Índices de rendimiento para las tablas del catálogo público.
     *
     * Problema: las queries de Home, Catálogo y Producto hacen JOINs y
     * filtros sobre columnas sin índice, causando full-table scans en
     * producto_categoria, producto, variante y stock_almacen.
     */
    public function up(): void
    {
        // ── producto_categoria ──────────────────────────────────────
        // Impacto: whereHas('categorias', ...) usa EXISTS sobre esta tabla.
        Schema::table('producto_categoria', function (Blueprint $table) {
            // Índice compuesto único (evita duplicados y acelera lookups)
            $table->unique(['producto_id', 'categoria_id'], 'pc_producto_categoria_unique');
            // Índice inverso para buscar productos de una categoría
            $table->index(['categoria_id', 'producto_id'], 'pc_categoria_producto_idx');
        });

        // ── producto ────────────────────────────────────────────────
        // Impacto: TODAS las queries públicas filtran por activo=1.
        Schema::table('producto', function (Blueprint $table) {
            $table->index(['activo', 'created_at'], 'producto_activo_created_idx');
            $table->index(['activo', 'marca_id'], 'producto_activo_marca_idx');
        });

        // ── variante ────────────────────────────────────────────────
        // Impacto: subquery de ordenamiento por precio + eager loading.
        Schema::table('variante', function (Blueprint $table) {
            $table->index(['producto_id', 'precio'], 'variante_producto_precio_idx');
        });

        // ── stock_almacen ───────────────────────────────────────────
        // Impacto: preloadStocks() y formatProducto() consultan stock.
        if (Schema::hasTable('stock_almacen')) {
            Schema::table('stock_almacen', function (Blueprint $table) {
                $table->index(['almacen_id', 'variante_id'], 'stock_almacen_variante_idx');
            });
        }

        // ── categoria ───────────────────────────────────────────────
        // Impacto: filtros por nombre y por padre en Catálogo.
        Schema::table('categoria', function (Blueprint $table) {
            $table->index(['categoria_padre_id', 'nombre'], 'cat_padre_nombre_idx');
        });
    }

    public function down(): void
    {
        Schema::table('producto_categoria', function (Blueprint $table) {
            $table->dropUnique('pc_producto_categoria_unique');
            $table->dropIndex('pc_categoria_producto_idx');
        });

        Schema::table('producto', function (Blueprint $table) {
            $table->dropIndex('producto_activo_created_idx');
            $table->dropIndex('producto_activo_marca_idx');
        });

        Schema::table('variante', function (Blueprint $table) {
            $table->dropIndex('variante_producto_precio_idx');
        });

        if (Schema::hasTable('stock_almacen')) {
            Schema::table('stock_almacen', function (Blueprint $table) {
                $table->dropIndex('stock_almacen_variante_idx');
            });
        }

        Schema::table('categoria', function (Blueprint $table) {
            $table->dropIndex('cat_padre_nombre_idx');
        });
    }
};
