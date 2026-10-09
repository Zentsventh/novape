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
        Schema::table('producto', function (Blueprint $table) {
            $table->string('slug')->unique()->nullable()->after('nombre');
        });

        // Generar slugs para los productos existentes
        $productos = \DB::table('producto')->get();
        foreach ($productos as $producto) {
            $slug = \Illuminate\Support\Str::slug($producto->nombre);
            
            // Verificar si el slug ya existe (raro pero posible si hay productos con el mismo nombre)
            $count = \DB::table('producto')->where('slug', $slug)->count();
            if ($count > 0) {
                $slug = $slug . '-' . $producto->id;
            }

            \DB::table('producto')->where('id', $producto->id)->update(['slug' => $slug]);
        }

        // Hacer la columna no nullable una vez poblada (opcional, pero buena práctica si el motor lo soporta fácilmente, 
        // lo dejaremos nullable por si acaso pero requerido en validación)
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
