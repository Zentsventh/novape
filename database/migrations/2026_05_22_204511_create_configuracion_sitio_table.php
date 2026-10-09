<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuracion_sitio', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 50)->unique();
            $table->text('valor')->nullable();
            $table->string('descripcion', 255)->nullable();
        });

        // Seed initial config
        DB::table('configuracion_sitio')->insert([
            [
                'clave' => 'logo_url',
                'valor' => 'https://nyc.cloud.appwrite.io/v1/storage/buckets/69fc0f9d001d6274d5d1/files/6a0e952f002986fd57d7/view?project=69fc0953002b1ac465c5&mode=admin',
                'descripcion' => 'Logo principal del sitio'
            ],
            [
                'clave' => 'nombre_sitio',
                'valor' => 'Novape',
                'descripcion' => 'Nombre del sitio web'
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_sitio');
    }
};
