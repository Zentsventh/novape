<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DynamicDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {


        // 3. Configuración Global (Redes y Contacto)
        \App\Models\ConfiguracionSitio::updateOrCreate(
            ['clave' => 'facebook_url'],
            ['valor' => 'https://facebook.com/novape', 'descripcion' => 'URL de Facebook']
        );
        \App\Models\ConfiguracionSitio::updateOrCreate(
            ['clave' => 'instagram_url'],
            ['valor' => 'https://instagram.com/novape', 'descripcion' => 'URL de Instagram']
        );
        \App\Models\ConfiguracionSitio::updateOrCreate(
            ['clave' => 'telefono_contacto'],
            ['valor' => '+51 999 888 777', 'descripcion' => 'Teléfono principal']
        );
        \App\Models\ConfiguracionSitio::updateOrCreate(
            ['clave' => 'email_contacto'],
            ['valor' => 'contacto@novape.com', 'descripcion' => 'Email principal']
        );
    }
}
