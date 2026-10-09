<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\Marca;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Variante;
use App\Models\ConfiguracionSitio;
use App\Models\Rol;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class ProfessionalStoreSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles y Permisos (Asumiendo que PermisosAndSeedAdminData o similar ya corrió o los creamos aquí)
        $adminRole = Rol::firstOrCreate(['nombre' => 'Admin']);
        $ventasRole = Rol::firstOrCreate(['nombre' => 'Vendedor']);
        $almacenRole = Rol::firstOrCreate(['nombre' => 'Almacenero']);
        
        // 2. Usuarios (Trabajadores)
        $admin = Usuario::firstOrCreate(
            ['email' => 'admin@novape.com'],
            [
                'nombres' => 'Eduardo',
                'apellidos' => 'Capcha',
                'tipo_documento' => 'DNI',
                'dni' => '12345678',
                'password_hash' => Hash::make('password123'),
                'estado' => 'activo',
                'telefono' => '987654321',
            ]
        );
        $admin->roles()->syncWithoutDetaching([$adminRole->id]);

        $vendedor = Usuario::firstOrCreate(
            ['email' => 'ventas@novape.com'],
            [
                'nombres' => 'María',
                'apellidos' => 'Gonzales',
                'tipo_documento' => 'DNI',
                'dni' => '87654321',
                'password_hash' => Hash::make('password123'),
                'estado' => 'activo',
                'telefono' => '999888777',
            ]
        );
        $vendedor->roles()->syncWithoutDetaching([$ventasRole->id]);

        $almacenero = Usuario::firstOrCreate(
            ['email' => 'almacen@novape.com'],
            [
                'nombres' => 'Carlos',
                'apellidos' => 'Ramirez',
                'tipo_documento' => 'DNI',
                'dni' => '44556677',
                'password_hash' => Hash::make('password123'),
                'estado' => 'activo',
                'telefono' => '911222333',
            ]
        );
        $almacenero->roles()->syncWithoutDetaching([$almacenRole->id]);

        // 3. Clientes Ficticios Reales
        $clientesData = [
            ['nombres' => 'Ana', 'apellidos' => 'Perez', 'dni' => '70123456', 'email' => 'ana.perez@gmail.com'],
            ['nombres' => 'Jorge', 'apellidos' => 'Lopez', 'dni' => '70123457', 'email' => 'jorge.lopez@hotmail.com'],
            ['nombres' => 'Lucía', 'apellidos' => 'Fernandez', 'dni' => '70123458', 'email' => 'lucia.fer@yahoo.com'],
            ['nombres' => 'Pedro', 'apellidos' => 'Castillo', 'dni' => '70123459', 'email' => 'pedro.cas@gmail.com'],
            ['nombres' => 'Marta', 'apellidos' => 'Sanchez', 'dni' => '70123460', 'email' => 'marta.san@gmail.com'],
            ['nombres' => 'Luis', 'apellidos' => 'Gomez', 'dni' => '70123461', 'email' => 'luis.gom@outlook.com'],
            ['nombres' => 'Carmen', 'apellidos' => 'Diaz', 'dni' => '70123462', 'email' => 'carmen.diaz@gmail.com'],
            ['nombres' => 'Raul', 'apellidos' => 'Torres', 'dni' => '70123463', 'email' => 'raul.torres@gmail.com'],
            ['nombres' => 'Rosa', 'apellidos' => 'Ruiz', 'dni' => '70123464', 'email' => 'rosa.ruiz@gmail.com'],
            ['nombres' => 'Juan', 'apellidos' => 'Vargas', 'dni' => '70123465', 'email' => 'juan.vargas@gmail.com'],
        ];

        $clientes = [];
        foreach ($clientesData as $c) {
            $clientes[] = Usuario::firstOrCreate(
                ['email' => $c['email']],
                [
                    'nombres' => $c['nombres'],
                    'apellidos' => $c['apellidos'],
                    'tipo_documento' => 'DNI',
                    'dni' => $c['dni'],
                    'password_hash' => Hash::make('12345678'),
                    'estado' => 'activo',
                    'telefono' => '9' . rand(10000000, 99999999),
                ]
            );
        }



        // 5. Marcas
        $marcasData = ['Apple', 'Samsung', 'Xiaomi', 'Sony', 'LG', 'HP', 'Lenovo', 'Asus', 'Nintendo'];
        $marcas = [];
        foreach ($marcasData as $m) {
            $marcas[$m] = Marca::firstOrCreate(['nombre' => $m]);
        }

        // 6. Categorías
        // 6. Categorías
        $categoriasData = [
            'Celulares' => ['Celulares', 'Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Honor', 'Celulares con IA', 'Accesorios y cases', 'Reacondicionados'],
            'Cómputo' => ['Laptops', 'Tablets', 'Impresoras y Tintas', 'Laptops alto rendimiento', 'Computadoras de Escritorio', 'Monitores', 'Accesorios', 'All in One', 'MacBook', 'Lenovo', 'Asus', 'Hp', 'Acer', 'Licencias y antivirus'],
            'Mundo Gamer' => ['Laptops Gamer', 'Sillas gamer', 'Monitores Gamer', 'Computadoras Gamer', 'Audífonos Gamer', 'Teclados Gamer', 'Accesorios'],
            'Audio' => ['Audífonos', 'Parlantes', 'Equipos de Sonido', 'Soundbar y Home Theater', 'Accesorios', 'JBL', 'Airpods', 'LG', 'Sony', 'Alexa'],
            'TV' => ['Televisores', 'TVs menores a 43"', 'TVs entre 50" y 58"', 'TVs mayores de 60"', 'TVs OLED, QLED, Nanocell', 'LG', 'Samsung', 'JVC', 'TCL', 'Accesorios'],
            'Videojuegos' => ['Consolas', 'Play Station', 'Nintendo', 'Juegos', 'Juegos Digitales'],
            'Cámaras y Drones' => ['Cámaras profesionales', 'Cámaras deportivas', 'Cámaras instantáneas', 'Drones', 'Accesorios'],
            'Smartwatches' => ['Apple', 'Samsung', 'Xiaomi', 'Huawei'],
            'Smarthome y domótica' => ['Asistentes de voz', 'Iluminación inteligente', 'Proyectores', 'Cámaras de seguridad', 'Aspiradoras robot', 'Reproductores Streaming']
        ];
        $categorias = [];
        $subcategoriasMap = [];
        foreach ($categoriasData as $nombrePadre => $subcategorias) {
            $catPadre = Categoria::firstOrCreate(
                ['nombre' => $nombrePadre, 'categoria_padre_id' => null],
                ['slug' => Str::slug($nombrePadre), 'descripcion' => 'Categoría de ' . $nombrePadre, 'activa' => true]
            );
            $categorias[$nombrePadre] = $catPadre;
            
            foreach ($subcategorias as $subNombre) {
                $subCat = Categoria::firstOrCreate(
                    ['nombre' => $subNombre, 'categoria_padre_id' => $catPadre->id],
                    ['slug' => Str::slug($nombrePadre . ' ' . $subNombre), 'descripcion' => 'Subcategoría ' . $subNombre, 'activa' => true]
                );
                $subcategoriasMap[$nombrePadre . '-' . $subNombre] = $subCat;
            }
        }

        // 7. Configuración del Sitio
        ConfiguracionSitio::updateOrCreate(
            ['clave' => 'envio_tarifa_plana'],
            ['valor' => '15.00', 'descripcion' => 'Costo de envío estándar']
        );
        ConfiguracionSitio::updateOrCreate(
            ['clave' => 'envio_gratis_minimo'],
            ['valor' => '500.00', 'descripcion' => 'Monto mínimo para envío gratis']
        );



        // 9. PRODUCTOS (30 productos realistas)
                        $productosData = [];

        // Generando 10 productos de Apple
        for($i=1; $i<=10; $i++) {
            $productosData[] = [
                'nombre' => 'iPhone ' . (15 - ($i % 3)) . ' Pro ' . ($i * 128) . 'GB Edition ' . $i,
                'marca' => 'Apple', 'cat' => ['Celulares', 'Apple'],
                'precio' => 4000.00 + ($i * 100), 'stock' => 100,
                'desc' => "Descubre el poder del ecosistema Apple con este increíble iPhone. Equipado con el chip más avanzado de la industria, pantalla Super Retina XDR y un diseño elegante. Su sistema de cámaras profesional captura cada detalle con precisión, mientras que su batería de larga duración te acompaña todo el día.",
                'img' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'Super Retina XDR OLED 6.1" - 6.7"',
                    'Procesador' => 'Apple A-Series Bionic/Pro',
                    'Memoria RAM' => '6GB / 8GB',
                    'Almacenamiento' => ($i * 128) . 'GB NVMe',
                    'Cámara Principal' => '48 MP + 12 MP (teleobjetivo) + 12 MP (ultrawide)',
                    'Cámara Frontal' => '12 MP f/1.9',
                    'Batería' => 'Larga duración, Carga Rápida',
                    'Sistema Operativo' => 'iOS 17',
                    'Conectividad' => '5G, Wi-Fi 6, Bluetooth 5.3',
                    'Seguridad' => 'Face ID'
                ]
            ];
        }

        // Generando 10 productos de Samsung
        for($i=1; $i<=10; $i++) {
            $productosData[] = [
                'nombre' => 'Samsung Galaxy S' . (24 - ($i % 3)) . ' Ultra ' . ($i * 128) . 'GB Variante ' . $i,
                'marca' => 'Samsung', 'cat' => ['Celulares', 'Samsung'],
                'precio' => 3500.00 + ($i * 80), 'stock' => 100,
                'desc' => "Vive la experiencia definitiva con el Galaxy S Ultra. Diseñado para ofrecer la mejor cámara, el rendimiento más rápido con Snapdragon for Galaxy y la icónica S Pen. Su diseño robusto y pantalla inmersiva lo convierten en la herramienta perfecta para creadores y profesionales.",
                'img' => 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'Dynamic AMOLED 2X 6.8" 120Hz',
                    'Procesador' => 'Snapdragon 8 Series',
                    'Memoria RAM' => '8GB / 12GB',
                    'Almacenamiento' => ($i * 128) . 'GB UFS 4.0',
                    'Cámara Principal' => '200 MP + 50 MP (tele) + 12 MP (ultrawide)',
                    'Cámara Frontal' => '12 MP',
                    'Batería' => '5000 mAh',
                    'Sistema Operativo' => 'Android 14, One UI 6',
                    'Soporte S Pen' => 'Sí, incluido',
                    'Conectividad' => '5G, Wi-Fi 7, Bluetooth 5.3'
                ]
            ];
        }

        // Generando 10 productos de Xiaomi
        for($i=1; $i<=10; $i++) {
            $productosData[] = [
                'nombre' => 'Xiaomi ' . (14 - ($i % 2)) . ' Pro ' . ($i * 64) . 'GB Modelo ' . $i,
                'marca' => 'Xiaomi', 'cat' => ['Celulares', 'Xiaomi'],
                'precio' => 2500.00 + ($i * 50), 'stock' => 100,
                'desc' => "Xiaomi vuelve a sorprender con un equipo de alto rendimiento a un precio inigualable. Con carga hiper rápida, cámaras desarrolladas con expertos en fotografía óptica y una pantalla vibrante, este dispositivo te dará la máxima productividad y entretenimiento en tu día a día.",
                'img' => 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'AMOLED 6.7" 120Hz',
                    'Procesador' => 'Snapdragon 8 Gen Series',
                    'Memoria RAM' => '8GB / 12GB',
                    'Almacenamiento' => ($i * 64) . 'GB',
                    'Cámara Principal' => '50 MP + 50 MP + 50 MP',
                    'Cámara Frontal' => '32 MP',
                    'Batería' => '4800 mAh',
                    'Carga Rápida' => '120W HyperCharge',
                    'Sistema Operativo' => 'HyperOS',
                    'Resistencia' => 'IP68'
                ]
            ];
        }

        // Generando 10 Laptops (5 Lenovo, 5 Asus)
        for($i=1; $i<=5; $i++) {
            $productosData[] = [
                'nombre' => 'Lenovo Legion ' . (5 + $i) . 'i Pro Gen ' . $i,
                'marca' => 'Lenovo', 'cat' => ['Cómputo', 'Lenovo', 'Laptops', 'Laptops Gamer'],
                'precio' => 4500.00 + ($i * 200), 'stock' => 100,
                'desc' => "Domina todos los juegos de última generación con la poderosa Legion. Equipada con procesadores y tarjetas gráficas de última línea, refrigeración Coldfront avanzada y una pantalla inmersiva para que no te pierdas ningún detalle de la acción.",
                'img' => 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => '16" WQXGA 165Hz IPS',
                    'Procesador' => 'Intel Core i7/i9 HX',
                    'Tarjeta Gráfica' => 'NVIDIA RTX 40' . (50 + ($i * 10)),
                    'Memoria RAM' => '16GB / 32GB DDR5',
                    'Almacenamiento' => '1TB SSD M.2',
                    'Refrigeración' => 'Legion Coldfront',
                    'Teclado' => 'TrueStrike RGB',
                    'Conectividad' => 'Wi-Fi 6E, Bluetooth 5.1',
                    'Batería' => '80Wh',
                    'Sistema Operativo' => 'Windows 11 Home'
                ]
            ];
            $productosData[] = [
                'nombre' => 'Asus ROG Zephyrus G' . (14 + ($i % 2)*2) . ' Modelo ' . $i,
                'marca' => 'Asus', 'cat' => ['Cómputo', 'Asus', 'Laptops', 'Laptops Gamer'],
                'precio' => 5000.00 + ($i * 150), 'stock' => 100,
                'desc' => "Ultraportabilidad y rendimiento gaming se unen en la Asus ROG Zephyrus. Con pantalla Nebula Display para colores perfectos y un diseño ligero con AniMe Matrix, esta laptop te permite jugar y crear contenido estés donde estés.",
                'img' => 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'ROG Nebula Display QHD+',
                    'Procesador' => 'AMD Ryzen 9',
                    'Tarjeta Gráfica' => 'NVIDIA RTX 40' . (60 + ($i * 10)),
                    'Memoria RAM' => '16GB / 32GB DDR5',
                    'Almacenamiento' => '1TB SSD M.2',
                    'Diseño' => 'AniMe Matrix o ROG Slash',
                    'Peso' => '1.65 kg',
                    'Audio' => 'Dolby Atmos, 4 altavoces',
                    'Conectividad' => 'Wi-Fi 6E, Bluetooth 5.2',
                    'Sistema Operativo' => 'Windows 11 Home'
                ]
            ];
        }

        // Generando 10 Consolas / Videojuegos (5 Sony, 5 Nintendo)
        for($i=1; $i<=5; $i++) {
            $productosData[] = [
                'nombre' => 'PlayStation 5 Edición Especial ' . $i,
                'marca' => 'Sony', 'cat' => ['Videojuegos', 'Play Station', 'Consolas'],
                'precio' => 2400.00 + ($i * 50), 'stock' => 100,
                'desc' => "Disfruta de la nueva generación con esta edición especial de PS5. Tiempos de carga ultrarrápidos, retroalimentación háptica, audio 3D y gatillos adaptativos te sumergen por completo en mundos increíbles y detallados a 4K.",
                'img' => 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Resolución Máxima' => '8K (soporte) / 4K nativo',
                    'Procesador' => 'AMD Ryzen Zen 2 personalizado',
                    'Gráficos' => 'RDNA 2, 10.28 TFLOPs',
                    'Memoria RAM' => '16GB GDDR6',
                    'Almacenamiento' => '825GB / 1TB SSD',
                    'Audio' => 'Tempest 3D AudioTech',
                    'Mando Incluido' => 'DualSense Wireless Controller',
                    'Unidad Óptica' => 'Ultra HD Blu-ray',
                    'Conectividad' => 'Wi-Fi 6, Ethernet, Bluetooth 5.1',
                    'Retrocompatibilidad' => 'Juegos de PS4 soportados'
                ]
            ];
            $productosData[] = [
                'nombre' => 'Nintendo Switch OLED Bundle ' . $i,
                'marca' => 'Nintendo', 'cat' => ['Videojuegos', 'Nintendo', 'Consolas'],
                'precio' => 1500.00 + ($i * 40), 'stock' => 100,
                'desc' => "Juega en la tele, en la mesa o en tus manos con la versatilidad inigualable de Nintendo Switch OLED. Esta edición incluye colores especiales y pantalla de 7 pulgadas con contraste espectacular para disfrutar de la vasta biblioteca de juegos de Nintendo.",
                'img' => 'https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'OLED táctil 7.0"',
                    'Resolución' => '1080p en TV, 720p Portátil',
                    'Almacenamiento' => '64GB Interno',
                    'Mandos' => 'Joy-Con L/R',
                    'Batería' => '4.5 a 9 horas',
                    'Audio' => 'Estéreo mejorado',
                    'Dock' => 'Incluye puerto LAN Ethernet',
                    'Procesador' => 'NVIDIA Custom Tegra',
                    'Conectividad' => 'Wi-Fi, Bluetooth',
                    'Peso' => '420g (con Joy-Cons)'
                ]
            ];
        }

        // Generando 10 TV (5 LG, 5 Samsung)
        for($i=1; $i<=5; $i++) {
            $productosData[] = [
                'nombre' => 'TV LG OLED ' . (55 + ($i * 10)) . '" Serie C' . $i,
                'marca' => 'LG', 'cat' => ['TV', 'LG', 'Televisores'],
                'precio' => 4000.00 + ($i * 500), 'stock' => 100,
                'desc' => "Un panel OLED evo que revoluciona lo que ves. Los píxeles autoiluminados producen negros perfectos e imágenes de contraste infinito. Su procesador con IA optimiza el sonido y la imagen para ofrecerte la experiencia del cine en tu sala.",
                'img' => 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'OLED evo 4K UHD',
                    'Tamaño' => (55 + ($i * 10)) . ' pulgadas',
                    'Tasa de Refresco' => '120Hz nativos',
                    'Procesador' => 'α9 AI Processor 4K Gen6',
                    'Formatos HDR' => 'Dolby Vision, HDR10, HLG',
                    'Audio' => 'Dolby Atmos, 40W 2.2ch',
                    'Sistema Operativo' => 'webOS 23',
                    'Gaming' => 'G-Sync, FreeSync, VRR, ALLM',
                    'Asistente Inteligente' => 'ThinQ AI, Alexa integrado',
                    'Conectividad' => '4x HDMI 2.1, Wi-Fi 5, Bluetooth 5.0'
                ]
            ];
            $productosData[] = [
                'nombre' => 'TV Samsung Neo QLED 8K ' . (65 + ($i * 10)) . '" QN' . ($i * 100),
                'marca' => 'Samsung', 'cat' => ['TV', 'Samsung', 'Televisores'],
                'precio' => 6000.00 + ($i * 600), 'stock' => 100,
                'desc' => "Experimenta una claridad superior con el TV Neo QLED de Samsung. La tecnología Quantum Matrix y los Mini LEDs ofrecen brillo y contraste extremos, mientras que su procesador inteligente escala cualquier contenido a resolución increíble. Diseño delgado y elegante.",
                'img' => 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
                'specs' => [
                    'Pantalla' => 'Neo QLED (Mini LED) 8K o 4K',
                    'Tamaño' => (65 + ($i * 10)) . ' pulgadas',
                    'Tasa de Refresco' => '120Hz (Hasta 144Hz PC)',
                    'Procesador' => 'Neural Quantum Processor',
                    'Formatos HDR' => 'Neo Quantum HDR+',
                    'Audio' => 'Object Tracking Sound (OTS+), Q-Symphony',
                    'Sistema Operativo' => 'Tizen OS',
                    'Gaming' => 'Motion Xcelerator Turbo+',
                    'Diseño' => 'Infinity One / NeoSlim',
                    'Conectividad' => '4x HDMI 2.1, Wi-Fi 6E, Bluetooth 5.2'
                ]
            ];
        }

        foreach ($productosData as $idx => $p) {
            $baseSku = strtoupper(substr($p['marca'], 0, 3)) . '-' . rand(1000, 9999);
            
            $prod = Producto::create([
                'nombre' => $p['nombre'],
                'slug' => Str::slug($p['nombre']),
                'descripcion' => $p['desc'],
                'marca_id' => $marcas[$p['marca']]->id,
                'sku_base' => $baseSku,
                'activo' => true,
                'garantias' => '12 Meses de Garantía Novape',
            ]);

            // Asignar Categorías
            $catIds = [];
            
            // First find the parent category
            $parentCatName = null;
            foreach ($p['cat'] as $c) {
                if (isset($categorias[$c])) {
                    $catIds[] = $categorias[$c]->id;
                    if (!$parentCatName) {
                        $parentCatName = $c;
                    }
                }
            }
            
            // Then find the subcategories belonging to this parent
            foreach ($p['cat'] as $c) {
                if ($parentCatName && isset($subcategoriasMap[$parentCatName . '-' . $c])) {
                    $catIds[] = $subcategoriasMap[$parentCatName . '-' . $c]->id;
                }
            }
            
            $prod->categorias()->sync($catIds);

                        // Crear Especificaciones Técnicas
            if (isset($p['specs'])) {
                foreach ($p['specs'] as $clave => $valor) {
                    \App\Models\ProductoEspecificacion::create([
                        'producto_id' => $prod->id,
                        'clave' => $clave,
                        'valor' => $valor
                    ]);
                }
            }

            // Crear Variante Principal
            $variante = Variante::create([
                'producto_id' => $prod->id,
                'sku' => $baseSku . '-01',
                'precio' => $p['precio'],
                'atributos' => json_encode(['Color' => 'Estándar']),
                'peso' => rand(5, 50) . '.00',
                'stock' => $p['stock'],
            ]);

            // Imagen (usando DB para evitar problemas si no existe el modelo ProductoImagen en los helpers)
            DB::table('producto_imagen')->insert([
                'producto_id' => $prod->id,
                'url' => $p['img'],
                'orden' => 1,
            ]);


        }
    }
}
