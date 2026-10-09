<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Categoria;

class ElectrohogarSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Limpiar tablas relacionadas con productos y categorías
        DB::table('producto_categoria')->truncate();
        DB::table('producto_imagen')->truncate();
        DB::table('historial_precio')->truncate();
        DB::table('variante')->truncate();
        DB::table('producto')->truncate();
        DB::table('categoria')->truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $estructura = [
            'Refrigeración' => [
                'Dispensadores y purificadores', 'Refrigeradoras', 'Congeladoras', 'Frigobares y vineras', 'Exhibidores y vitrinas'
            ],
            'Cocina' => [
                'Cocinas de pie', 'Cocinas empotrables', 'Cocinas de mesa', 'Campanas', 'Hornos empotrables', 'Combos de cocina'
            ],
            'Lavado' => [
                'Lavadoras', 'Lavasecas', 'Secadoras', 'Centros de lavado', 'Lavavajillas', 'Instalación de lavadoras'
            ],
            'Climatización' => [
                'Ventiladores', 'Aires acondicionados', 'Termas y rapiduchas', 'Purificadores de aire', 'Deshumecedores', 'Calentadores y estufas'
            ],
            'Limpieza' => [
                'Aspiradoras', 'Hidrolavadoras', 'Lustradoras', 'Accesorios y otros'
            ],
            'Industrial' => [
                'Congeladoras y conservadoras', 'Equipos de producción', 'Exhibidoras y vitrinas', 'Equipos complementarios'
            ],
            'Electrodomésticos' => [
                'Licuadoras', 'Hornos microondas', 'Freidoras de aire', 'Ollas arroceras', 'Extractores y exprimidores',
                'Cafeteras', 'Batidoras', 'Hervidores', 'Tostadoras y sandwicheras', 'Hornos eléctricos', 'Parrillas eléctricas y grills',
                'Cocina entretenida', 'Combos Electrodomésticos', 'Procesadores y picatodos', 'Vaporizador de prendas',
                'Planchas', 'Máquinas de coser', 'Otros electrodomésticos', 'Accesorios'
            ]
        ];

        foreach ($estructura as $padre => $hijos) {
            $catPadre = Categoria::create([
                'nombre' => $padre,
                'descripcion' => "Categoría principal de $padre",
                'categoria_padre_id' => null
            ]);

            foreach ($hijos as $hijo) {
                Categoria::create([
                    'nombre' => $hijo,
                    'descripcion' => "Subcategoría de $padre",
                    'categoria_padre_id' => $catPadre->id
                ]);
            }
        }
    }
}
