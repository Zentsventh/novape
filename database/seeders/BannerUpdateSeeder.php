<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BannerUpdateSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        DB::table('banners')->truncate();
        
        DB::table('banners')->insert([
            [
                'titulo' => 'Lo mejor en Telefonía',
                'subtitulo' => 'Descubre nuestros últimos modelos',
                'imagen_url' => '/images/banners/1784249730_efe-slider-b2c-02-telefonia-01_2_.webp',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 1,
                'activo' => true,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'titulo' => 'Electrodomésticos para el hogar',
                'subtitulo' => 'Equipa tu casa con lo mejor',
                'imagen_url' => '/images/banners/banner_electrodomesticos.png',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 2,
                'activo' => true,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'titulo' => 'Línea Blanca',
                'subtitulo' => 'Refrigeradoras, cocinas y más',
                'imagen_url' => '/images/banners/banner_linea_blanca.png',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 3,
                'activo' => true,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'titulo' => 'Samsung Galaxy',
                'subtitulo' => 'La innovación en tus manos',
                'imagen_url' => '/images/banners/banner_samsung_galaxy.png',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 4,
                'activo' => true,
                'fecha_inicio' => null,
                'fecha_fin' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        ]);
    }
}
