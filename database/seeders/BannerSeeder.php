<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BannerSeeder extends Seeder
{
    public function run()
    {
        DB::table('banners')->truncate(); // Clear existing if any

        $banners = [
            [
                'titulo' => 'Electrodomésticos',
                'subtitulo' => 'Las mejores marcas',
                'imagen_url' => 'images/banners/banner_electrodomesticos.png',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 1,
                'activo' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'titulo' => 'Línea Blanca',
                'subtitulo' => 'Equipa tu hogar',
                'imagen_url' => 'images/banners/banner_linea_blanca.png',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 2,
                'activo' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'titulo' => 'Samsung Galaxy',
                'subtitulo' => 'Descubre la nueva generación',
                'imagen_url' => 'images/banners/banner_samsung_galaxy.png',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 3,
                'activo' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'titulo' => 'Telefonía 1',
                'subtitulo' => 'Cyber WOW Telefonia',
                'imagen_url' => 'images/banners/1784249178_efe-slider-b2c-02-telefonia-01_2_.webp',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 4,
                'activo' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'titulo' => 'Telefonía 2',
                'subtitulo' => 'Cyber WOW Telefonia 2',
                'imagen_url' => 'images/banners/1784249730_efe-slider-b2c-02-telefonia-01_2_.webp',
                'enlace_url' => '/catalogo',
                'posicion' => 'hero',
                'orden' => 5,
                'activo' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]
        ];

        DB::table('banners')->insert($banners);
    }
}
