<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StoreNavigationSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $parents = DB::table('categoria')->whereNull('categoria_padre_id')->pluck('id', 'nombre');
            $records = json_decode(file_get_contents(database_path('seed-data/catalogo-real.json')), true, 512, JSON_THROW_ON_ERROR);
            foreach ($records as $record) {
                $parent = $parents[$record['category']] ?? null;
                $product = DB::table('producto')->where('fuente_url', $record['source_url'])->value('id');
                if (!$parent || !$product) continue;
                $name = $this->classify($record['category'], Str::lower(Str::ascii($record['name'])));
                $slug = Str::slug($record['category'].' '.$name);
                DB::table('categoria')->updateOrInsert(['slug' => $slug], [
                    'nombre' => $name, 'categoria_padre_id' => $parent, 'activa' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $child = DB::table('categoria')->where('slug', $slug)->value('id');
                DB::table('producto_categoria')->updateOrInsert(['producto_id' => $product, 'categoria_id' => $child], []);
            }
            $banners = json_decode(file_get_contents(database_path('seed-data/banners-efe.json')), true, 512, JSON_THROW_ON_ERROR);
            foreach ($banners as $index => $banner) {
                $duplicates = DB::table('banners')->where('fuente_url', $banner['fuente_url'])->where('imagen_url', $banner['desktop_url'])->orderBy('id')->pluck('id');
                if ($duplicates->count() > 1) DB::table('banners')->whereIn('id', $duplicates->slice(1))->delete();
                DB::table('banners')->updateOrInsert(['imagen_url' => $banner['desktop_url']], [
                    'titulo' => $banner['titulo'],
                    'imagen_url' => $banner['desktop_url'], 'imagen_mobile_url' => $banner['mobile_url'],
                    'enlace_url' => '/catalogo?'.http_build_query(['categoria' => $banner['categoria']]),
                    'fuente_url' => $banner['fuente_url'], 'posicion' => 'hero', 'orden' => $index + 1,
                    'activo' => true, 'fecha_inicio' => null, 'fecha_fin' => null, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        });
        foreach (['home_categorias','home_mejor_semana','home_banners','catalog_categorias_base','home_categorias_menu'] as $key) Cache::forget($key);
        $this->command?->info('Subcategorías asociadas a productos y cinco banners EFE cargados.');
    }

    private function classify(string $category, string $name): string
    {
        return match ($category) {
            'Celulares' => 'Smartphones',
            'Cómputo' => str_contains($name, 'gamer') || str_contains($name, 'rtx') ? 'Laptops gamer' : 'Laptops',
            'Mundo Gamer' => match (true) { str_contains($name, 'teclado') => 'Teclados gamer', str_contains($name, 'audifono') => 'Audífonos gamer', default => 'Laptops gamer' },
            'Audio' => match (true) { str_contains($name, 'soundbar') || str_contains($name, 'barra') => 'Soundbars', str_contains($name, 'echo') => 'Parlantes inteligentes', default => 'Parlantes y equipos de sonido' },
            'TV' => 'Smart TV',
            'Smartwatches' => str_contains($name, 'band') ? 'Pulseras inteligentes' : 'Relojes inteligentes',
            'Videojuegos' => str_starts_with($name, 'videojuego') ? 'Juegos' : 'Consolas',
            'Refrigeración' => str_contains($name, 'exhibidora') ? 'Exhibidoras' : 'Refrigeradoras',
            'Lavado' => match (true) { str_contains($name, 'lavaseca') => 'Lavasecas', str_contains($name, 'hidrolavadora') => 'Hidrolavadoras', default => 'Lavadoras' },
            'Cocina' => str_contains($name, 'microondas') ? 'Microondas' : 'Cocinas de pie',
            'Smarthome y domótica' => match (true) { str_contains($name, 'camara') => 'Cámaras de seguridad', str_contains($name, 'aspiradora') => 'Aspiradoras robot', str_contains($name, 'tapices') => 'Limpieza del hogar', str_contains($name, 'starlink') => 'Redes y conectividad', str_contains($name, 'convertidor') => 'Streaming', default => 'Asistentes de voz' },
            'Electrodomésticos' => match (true) { str_starts_with($name, 'combo') => 'Combos de electrodomésticos', str_contains($name, 'cafetera') => 'Cafeteras', str_contains($name, 'freidora') => 'Freidoras de aire', str_contains($name, 'grill') => 'Grills eléctricos', default => 'Licuadoras' },
            'Cámaras y Drones' => match (true) { str_contains($name, 'impresora') => 'Impresoras instantáneas', str_contains($name, 'pelicula') => 'Películas instantáneas', str_contains($name, 'gopro') => 'Cámaras deportivas', str_contains($name, 'nexxt') => 'Cámaras de seguridad', default => 'Cámaras instantáneas' },
            default => 'Productos',
        };
    }
}
