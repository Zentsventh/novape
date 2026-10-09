<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ProveedorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $proveedores = [
            [
                'nombre' => 'TechNova S.A.',
                'ruc' => '20123456781',
                'direccion' => 'Av. Tecnológica 123, Lima',
                'telefono' => '01-123-4567',
                'email' => 'ventas@technova.com.pe',
                'contacto' => 'Juan Pérez',
                'activo' => true
            ],
            [
                'nombre' => 'ElectroMundo Distribuciones',
                'ruc' => '20987654321',
                'direccion' => 'Calle Principal 456, Arequipa',
                'telefono' => '054-987-654',
                'email' => 'contacto@electromundo.pe',
                'contacto' => 'María Gómez',
                'activo' => true
            ],
            [
                'nombre' => 'Importaciones Globales SAC',
                'ruc' => '20555555551',
                'direccion' => 'Av. Industrial 789, Trujillo',
                'telefono' => '999-888-777',
                'email' => 'info@importglobal.com',
                'contacto' => 'Carlos Ruiz',
                'activo' => true
            ],
            [
                'nombre' => 'MegaTech Perú',
                'ruc' => '20333333331',
                'direccion' => 'Jr. Puno 1000, Cercado de Lima',
                'telefono' => '01-333-3333',
                'email' => 'soporte@megatech.pe',
                'contacto' => 'Ana Torres',
                'activo' => true
            ],
            [
                'nombre' => 'Innova Electrónica',
                'ruc' => '20444444441',
                'direccion' => 'Av. Javier Prado Este 234, San Isidro',
                'telefono' => '01-444-4444',
                'email' => 'ventas@innovaelec.pe',
                'contacto' => 'Luis Fernández',
                'activo' => true
            ],
        ];

        foreach ($proveedores as $prov) {
            \App\Models\Proveedor::create($prov);
        }
    }
}
