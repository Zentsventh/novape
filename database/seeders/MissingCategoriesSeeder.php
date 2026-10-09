<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Marca;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Variante;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class MissingCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Creando productos para categorías faltantes...');

        $marcasNuevas = [
            'Logitech', 'Razer', 'Corsair', 'SteelSeries', 'Secretlab', 'Cougar', 
            'JBL', 'Bose', 'Ultimate Ears', 'Canon', 'Nikon', 'Panasonic', 
            'GoPro', 'DJI', 'Insta360', 'Garmin', 'Amazon', 'Google', 
            'Philips', 'TP-Link', 'Ring', 'iRobot'
        ];

        foreach ($marcasNuevas as $m) {
            Marca::firstOrCreate(['nombre' => $m]);
        }

        $todasMarcas = Marca::all()->keyBy('nombre');
        
        $categorias = Categoria::whereNull('categoria_padre_id')->get()->keyBy('nombre');
        $subcategorias = Categoria::whereNotNull('categoria_padre_id')->get()->groupBy('categoria_padre_id');

        $productosData = [];

        // 1. Mundo Gamer (10 items)
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Teclado Mecánico Gamer ' . ['Logitech', 'Razer', 'Corsair'][$i-1] . ' Modelo ' . $i,
                'marca' => ['Logitech', 'Razer', 'Corsair'][$i-1],
                'cat' => 'Mundo Gamer',
                'subcat' => 'Teclados Gamer',
                'precio' => 300.00 + ($i * 50),
                'stock' => 50,
                'desc' => "Teclado mecánico de alto rendimiento para juegos competitivos. Interruptores ultra rápidos y retroiluminación RGB.",
                'img' => 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Ratón Gamer Profesional ' . ['Logitech', 'Razer', 'SteelSeries'][$i-1] . ' ' . $i,
                'marca' => ['Logitech', 'Razer', 'SteelSeries'][$i-1],
                'cat' => 'Mundo Gamer',
                'subcat' => 'Accesorios',
                'precio' => 150.00 + ($i * 30),
                'stock' => 50,
                'desc' => "Ratón ultra ligero con sensor óptico de alta precisión, ideal para eSports y juegos FPS.",
                'img' => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=2; $i++) {
            $productosData[] = [
                'nombre' => 'Monitor Gamer UltraWide ' . ['Asus', 'LG'][$i-1] . ' 144Hz ' . $i,
                'marca' => ['Asus', 'LG'][$i-1],
                'cat' => 'Mundo Gamer',
                'subcat' => 'Monitores Gamer',
                'precio' => 1200.00 + ($i * 100),
                'stock' => 30,
                'desc' => "Monitor curvo con tasa de refresco ultrarrápida para una experiencia inmersiva y sin lag.",
                'img' => 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=2; $i++) {
            $productosData[] = [
                'nombre' => 'Silla Gamer Ergonómica ' . ['Secretlab', 'Cougar'][$i-1] . ' V' . $i,
                'marca' => ['Secretlab', 'Cougar'][$i-1],
                'cat' => 'Mundo Gamer',
                'subcat' => 'Sillas gamer',
                'precio' => 800.00 + ($i * 150),
                'stock' => 20,
                'desc' => "Comodidad extrema para largas sesiones de juego, con soporte lumbar y materiales premium.",
                'img' => 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=800&q=80',
            ];
        }

        // 2. Audio (10 items)
        for($i=1; $i<=4; $i++) {
            $productosData[] = [
                'nombre' => 'Audífonos Inalámbricos ' . ['Sony', 'Apple', 'JBL', 'Bose'][$i-1] . ' Noise Cancelling',
                'marca' => ['Sony', 'Apple', 'JBL', 'Bose'][$i-1],
                'cat' => 'Audio',
                'subcat' => 'Audífonos',
                'precio' => 500.00 + ($i * 100),
                'stock' => 60,
                'desc' => "Auriculares con cancelación de ruido activa de última generación y sonido de alta fidelidad.",
                'img' => 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Parlante Portátil Bluetooth ' . ['JBL', 'Sony', 'Ultimate Ears'][$i-1] . ' Boom ' . $i,
                'marca' => ['JBL', 'Sony', 'Ultimate Ears'][$i-1],
                'cat' => 'Audio',
                'subcat' => 'Parlantes',
                'precio' => 300.00 + ($i * 50),
                'stock' => 80,
                'desc' => "Parlante resistente al agua con sonido potente de 360 grados y batería de larga duración.",
                'img' => 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Soundbar ' . ['LG', 'Samsung', 'Sony'][$i-1] . ' Dolby Atmos ' . $i,
                'marca' => ['LG', 'Samsung', 'Sony'][$i-1],
                'cat' => 'Audio',
                'subcat' => 'Soundbar y Home Theater',
                'precio' => 900.00 + ($i * 200),
                'stock' => 40,
                'desc' => "Lleva el audio del cine a tu hogar con esta barra de sonido que ofrece experiencia envolvente 3D.",
                'img' => 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
            ];
        }

        // 3. Cámaras y Drones (10 items)
        for($i=1; $i<=4; $i++) {
            $productosData[] = [
                'nombre' => 'Cámara Mirrorless Profesional ' . ['Sony', 'Canon', 'Nikon', 'Panasonic'][$i-1] . ' M' . $i,
                'marca' => ['Sony', 'Canon', 'Nikon', 'Panasonic'][$i-1],
                'cat' => 'Cámaras y Drones',
                'subcat' => 'Cámaras profesionales',
                'precio' => 4500.00 + ($i * 500),
                'stock' => 15,
                'desc' => "Cámara de lentes intercambiables con sensor Full Frame para fotografía y video profesional.",
                'img' => 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Cámara de Acción ' . ['GoPro', 'DJI', 'Insta360'][$i-1] . ' Action ' . $i,
                'marca' => ['GoPro', 'DJI', 'Insta360'][$i-1],
                'cat' => 'Cámaras y Drones',
                'subcat' => 'Cámaras deportivas',
                'precio' => 1200.00 + ($i * 100),
                'stock' => 40,
                'desc' => "Captura tus aventuras en 4K con esta cámara compacta, resistente al agua y con estabilización avanzada.",
                'img' => 'https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Dron Plegable DJI Mavic Series ' . $i,
                'marca' => 'DJI',
                'cat' => 'Cámaras y Drones',
                'subcat' => 'Drones',
                'precio' => 3000.00 + ($i * 400),
                'stock' => 25,
                'desc' => "Dron ultraportátil con cámara estabilizada en 3 ejes, capaz de grabar en resolución hipernítida.",
                'img' => 'https://images.unsplash.com/photo-1507580461415-b1b071850165?auto=format&fit=crop&w=800&q=80',
            ];
        }

        // 4. Smartwatches (10 items)
        for($i=1; $i<=4; $i++) {
            $productosData[] = [
                'nombre' => 'Apple Watch Series ' . (9 - $i + 1) . ' Edición ' . $i,
                'marca' => 'Apple',
                'cat' => 'Smartwatches',
                'subcat' => 'Apple',
                'precio' => 1500.00 + ($i * 100),
                'stock' => 70,
                'desc' => "El smartwatch definitivo para una vida saludable, con medición de oxígeno en sangre y ECG.",
                'img' => 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Samsung Galaxy Watch ' . (6 - $i + 1) . ' Classic',
                'marca' => 'Samsung',
                'cat' => 'Smartwatches',
                'subcat' => 'Samsung',
                'precio' => 1200.00 + ($i * 50),
                'stock' => 60,
                'desc' => "Reloj inteligente premium con bisel giratorio clásico y análisis de composición corporal.",
                'img' => 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Smartwatch Deportivo ' . ['Garmin', 'Xiaomi', 'Huawei'][$i-1] . ' Fit ' . $i,
                'marca' => ['Garmin', 'Xiaomi', 'Huawei'][$i-1],
                'cat' => 'Smartwatches',
                'subcat' => ['Garmin' => 'Xiaomi', 'Xiaomi' => 'Xiaomi', 'Huawei' => 'Huawei'][$i-1] ?? 'Xiaomi',
                'precio' => 800.00 + ($i * 80),
                'stock' => 50,
                'desc' => "Reloj inteligente enfocado en el rendimiento deportivo con GPS integrado y gran autonomía.",
                'img' => 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
            ];
        }

        // 5. Smarthome y domótica (10 items)
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Asistente de Voz ' . ['Amazon Echo', 'Google Nest', 'Apple HomePod'][$i-1] . ' Gen ' . $i,
                'marca' => ['Amazon', 'Google', 'Apple'][$i-1],
                'cat' => 'Smarthome y domótica',
                'subcat' => 'Asistentes de voz',
                'precio' => 250.00 + ($i * 50),
                'stock' => 100,
                'desc' => "Asistente inteligente con altavoz de gran sonido. Controla toda tu casa inteligente con tu voz.",
                'img' => 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=3; $i++) {
            $productosData[] = [
                'nombre' => 'Kit de Iluminación Inteligente ' . ['Philips', 'Xiaomi', 'TP-Link'][$i-1] . ' Color ' . $i,
                'marca' => ['Philips', 'Xiaomi', 'TP-Link'][$i-1],
                'cat' => 'Smarthome y domótica',
                'subcat' => 'Iluminación inteligente',
                'precio' => 300.00 + ($i * 20),
                'stock' => 80,
                'desc' => "Crea el ambiente perfecto con bombillas inteligentes multicolores controlables desde tu smartphone.",
                'img' => 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=2; $i++) {
            $productosData[] = [
                'nombre' => 'Cámara de Seguridad ' . ['Ring', 'Xiaomi'][$i-1] . ' Pro ' . $i,
                'marca' => ['Ring', 'Xiaomi'][$i-1],
                'cat' => 'Smarthome y domótica',
                'subcat' => 'Cámaras de seguridad',
                'precio' => 400.00 + ($i * 50),
                'stock' => 60,
                'desc' => "Cámara de vigilancia WiFi con resolución 2K, visión nocturna y detección de movimiento AI.",
                'img' => 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=800&q=80',
            ];
        }
        for($i=1; $i<=2; $i++) {
            $productosData[] = [
                'nombre' => 'Aspiradora Robot Inteligente ' . ['iRobot', 'Xiaomi'][$i-1] . ' Clean ' . $i,
                'marca' => ['iRobot', 'Xiaomi'][$i-1],
                'cat' => 'Smarthome y domótica',
                'subcat' => 'Aspiradoras robot',
                'precio' => 1500.00 + ($i * 200),
                'stock' => 35,
                'desc' => "Mantén tu hogar impecable sin esfuerzo con este robot aspirador con mapeo láser inteligente.",
                'img' => 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
            ];
        }

        foreach ($productosData as $p) {
            $marca = $todasMarcas[$p['marca']] ?? Marca::firstOrCreate(['nombre' => $p['marca']]);
            
            $baseSku = strtoupper(substr($p['marca'], 0, 3)) . '-' . rand(10000, 99999);
            
            $prod = Producto::create([
                'nombre' => $p['nombre'],
                'slug' => Str::slug($p['nombre'] . ' ' . rand(100, 999)),
                'descripcion' => $p['desc'],
                'marca_id' => $marca->id,
                'sku_base' => $baseSku,
                'activo' => true,
                'garantias' => '12 Meses de Garantía',
            ]);

            $catPadre = $categorias[$p['cat']] ?? null;
            $catIds = [];
            
            if ($catPadre) {
                $catIds[] = $catPadre->id;
                
                // Buscar subcategoría
                $subCatList = $subcategorias[$catPadre->id] ?? collect();
                $subCat = $subCatList->firstWhere('nombre', $p['subcat']);
                
                if (!$subCat) {
                    $subCat = Categoria::create([
                        'nombre' => $p['subcat'],
                        'slug' => Str::slug($p['cat'] . ' ' . $p['subcat']),
                        'descripcion' => 'Subcategoría ' . $p['subcat'],
                        'categoria_padre_id' => $catPadre->id,
                        'activa' => true
                    ]);
                    // Actualizar coleccion en memoria para próximos usos
                    if (!isset($subcategorias[$catPadre->id])) {
                        $subcategorias[$catPadre->id] = collect([$subCat]);
                    } else {
                        $subcategorias[$catPadre->id]->push($subCat);
                    }
                }
                
                $catIds[] = $subCat->id;
            }
            
            $prod->categorias()->sync($catIds);

            // Crear Variante Principal
            Variante::create([
                'producto_id' => $prod->id,
                'sku' => $baseSku . '-01',
                'precio' => $p['precio'],
                'atributos' => json_encode(['Color' => 'Estándar']),
                'peso' => rand(1, 10) . '.00',
                'stock' => $p['stock'],
            ]);

            // Imagen
            DB::table('producto_imagen')->insert([
                'producto_id' => $prod->id,
                'url' => $p['img'],
                'orden' => 1,
            ]);
        }
        
        $this->command->info('Se agregaron 50 productos nuevos a las categorías.');
    }
}
