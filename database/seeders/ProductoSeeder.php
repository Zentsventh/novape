<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductoSeeder extends Seeder
{
    public function run(): void
    {
        $defaultImage = 'https://www.efe.com.pe/media/catalog/product/t/w/twvs4001098.jpg?quality=85&bg-color=255,255,255&fit=bounds&height=400&width=400&canvas=400:400';

        // ========== MARCAS ==========
        $marcas = [
            'Samsung', 'LG', 'Sony', 'Apple', 'Xiaomi',
            'Huawei', 'TCL', 'Hisense', 'Electrolux', 'Indurama',
            'Oster', 'HP', 'Lenovo', 'ASUS', 'Acer',
            'JBL', 'Bose', 'Logitech', 'Nintendo', 'PlayStation',
            'Hyundai', 'Mabe', 'Whirlpool', 'Motorola', 'OPPO',
            'Realme', 'iFFALCON', 'Harman Kardon', 'Xbox', 'Rosen',
            'Adidas', 'Nike', 'Reebok', 'Under Armour', 'Puma',
        ];

        foreach ($marcas as $marca) {
            DB::table('marca')->insert(['nombre' => $marca]);
        }

        // Obtener IDs
        $marcaIds = [];
        foreach (DB::table('marca')->get() as $m) {
            $marcaIds[$m->nombre] = $m->id;
        }

        // ========== CATEGORÍAS ==========
        $categorias = [
            ['nombre' => 'Televisores', 'descripcion' => 'Smart TV, LED, OLED, QLED y más', 'categoria_padre_id' => null],
            ['nombre' => 'Electrohogar', 'descripcion' => 'Lavadoras, cocinas, refrigeradoras y más', 'categoria_padre_id' => null],
            ['nombre' => 'Computación', 'descripcion' => 'Laptops, PCs, monitores y periféricos', 'categoria_padre_id' => null],
            ['nombre' => 'Celulares', 'descripcion' => 'Smartphones y accesorios móviles', 'categoria_padre_id' => null],
            ['nombre' => 'Audio', 'descripcion' => 'Parlantes, audífonos y equipos de sonido', 'categoria_padre_id' => null],
            ['nombre' => 'Videojuegos', 'descripcion' => 'Consolas, juegos y accesorios gaming', 'categoria_padre_id' => null],
            ['nombre' => 'Accesorios', 'descripcion' => 'Accesorios tecnológicos y gadgets', 'categoria_padre_id' => null],
            ['nombre' => 'Dormitorio', 'descripcion' => 'Colchones, camas y muebles de dormitorio', 'categoria_padre_id' => null],
            ['nombre' => 'Deporte', 'descripcion' => 'Equipamiento deportivo y fitness', 'categoria_padre_id' => null],
        ];

        foreach ($categorias as $cat) {
            DB::table('categoria')->insert($cat);
        }

        $catIds = [];
        foreach (DB::table('categoria')->get() as $c) {
            $catIds[$c->nombre] = $c->id;
        }

        // ========== PRODUCTOS POR CATEGORÍA ==========
        // Estructura: [nombre, marca, precio_actual, precio_anterior, descuento%]

        $productosPorCategoria = [
            // ---- TELEVISORES ----
            'Televisores' => [
                ['TV iFFALCON 55" 4K Ultra HD Google TV 55U65 by TCL', 'iFFALCON', 1049.00, 1599.00, 34],
                ['TV Hyundai 32" QLED Google TV HYLED3259QG', 'Hyundai', 529.00, 599.00, 12],
                ['TV iFFALCON 50" QLED FHD Google 50S55A by TCL', 'iFFALCON', 899.00, 1499.00, 40],
                ['TV TCL 55" LED 4K UHD Google TV 55P6K', 'TCL', 1189.00, 1449.00, 18],
                ['TV iFFALCON 40" QLED FHD Google 40S55A by TCL', 'iFFALCON', 699.00, 799.00, 13],
            ],

            // ---- ELECTROHOGAR ----
            'Electrohogar' => [
                ['Lavadora Samsung 13KG Eco-Bubble WA40F13E4CPE Gris', 'Samsung', 1199.00, 1699.00, 29],
                ['Cocina de pie Electrolux 5 Quemadores 76CM FE5LMR', 'Electrolux', 1249.00, 1649.00, 24],
                ['Cocina de pie Electrolux 4 Quemadores FE4GP Negro', 'Electrolux', 1299.00, 1549.00, 16],
                ['Licuadora Oster 1.5LT 2112242 Roja', 'Oster', 199.00, 259.00, 23],
                ['Refrigeradora Indurama 529LT RI-795Di', 'Indurama', 1999.00, 3299.00, 39],
            ],

            // ---- COMPUTACIÓN ----
            'Computación' => [
                ['Laptop HP 15-fd0013la Intel Core i5 15.6" 8GB 512GB SSD', 'HP', 2299.00, 2799.00, 18],
                ['Laptop Lenovo IdeaPad 3 15IAU7 Intel Core i7 15.6" 16GB', 'Lenovo', 2899.00, 3499.00, 17],
                ['Laptop ASUS VivoBook 15 X1502ZA Intel Core i3 15.6"', 'ASUS', 1599.00, 1999.00, 20],
                ['Monitor Samsung 27" FHD Curvo LC27F390FHL', 'Samsung', 699.00, 899.00, 22],
                ['Laptop Acer Aspire 5 A515-57 Intel Core i5 15.6" 8GB', 'Acer', 2099.00, 2599.00, 19],
            ],

            // ---- CELULARES ----
            'Celulares' => [
                ['Samsung Galaxy A15 128GB 4G Negro', 'Samsung', 549.00, 699.00, 21],
                ['Xiaomi Redmi Note 13 Pro 256GB 5G Azul', 'Xiaomi', 1099.00, 1399.00, 21],
                ['Apple iPhone 15 128GB Negro', 'Apple', 3299.00, 3799.00, 13],
                ['Motorola Moto G54 5G 256GB Azul', 'Motorola', 799.00, 999.00, 20],
                ['OPPO A79 5G 128GB Negro Misterioso', 'OPPO', 699.00, 849.00, 18],
            ],

            // ---- AUDIO ----
            'Audio' => [
                ['Parlante JBL Charge 5 Bluetooth Negro', 'JBL', 499.00, 649.00, 23],
                ['Audífonos Sony WH-1000XM5 Bluetooth Negro', 'Sony', 1499.00, 1799.00, 17],
                ['Parlante JBL Flip 6 Bluetooth Rojo', 'JBL', 399.00, 499.00, 20],
                ['Barra de Sonido Samsung HW-C450 2.1 Canales', 'Samsung', 599.00, 799.00, 25],
                ['Parlante Harman Kardon Onyx Studio 8 Negro', 'Harman Kardon', 899.00, 1099.00, 18],
            ],

            // ---- VIDEOJUEGOS ----
            'Videojuegos' => [
                ['Consola Nintendo Switch 2 Bundle Mario Kart World', 'Nintendo', 2299.00, 3299.00, 30],
                ['PlayStation 5 Slim Digital Edition 1TB', 'PlayStation', 1899.00, 2199.00, 14],
                ['Xbox Series S 512GB Blanco', 'Xbox', 1299.00, 1599.00, 19],
                ['Control DualSense PS5 Starlight Blue', 'PlayStation', 299.00, 349.00, 14],
                ['Nintendo Switch OLED Edición Mario Red', 'Nintendo', 1599.00, 1899.00, 16],
            ],

            // ---- ACCESORIOS ----
            'Accesorios' => [
                ['Smartwatch Samsung Galaxy Watch6 40mm Negro', 'Samsung', 899.00, 1199.00, 25],
                ['Mouse Logitech MX Master 3S Inalámbrico Negro', 'Logitech', 399.00, 499.00, 20],
                ['Teclado Logitech K380 Bluetooth Multi-Device Rosa', 'Logitech', 149.00, 199.00, 25],
                ['Apple AirPods Pro 2da Generación USB-C', 'Apple', 999.00, 1199.00, 17],
                ['Webcam Logitech C920 HD Pro 1080p', 'Logitech', 249.00, 329.00, 24],
            ],

            // ---- DORMITORIO ----
            'Dormitorio' => [
                ['Colchón Rosen New Style 2 Queen 160x200cm', 'Rosen', 1499.00, 2299.00, 35],
                ['Base Sommier Rosen Queen 160x200cm Chocolate', 'Rosen', 899.00, 1199.00, 25],
                ['Juego de Sábanas Rosen 600 Hilos King Blanco', 'Rosen', 299.00, 399.00, 25],
                ['Almohada Rosen Memory Foam Premium', 'Rosen', 149.00, 199.00, 25],
                ['Edredón Rosen Plumón Queen Gris', 'Rosen', 399.00, 549.00, 27],
            ],

            // ---- DEPORTE ----
            'Deporte' => [
                ['Zapatillas Adidas Runfalcon 3.0 Negro', 'Adidas', 249.00, 329.00, 24],
                ['Caminadora Eléctrica Plegable 2.5HP 12km/h', 'Under Armour', 1499.00, 1999.00, 25],
                ['Mancuernas Ajustables 24KG Set Completo', 'Nike', 599.00, 799.00, 25],
                ['Bicicleta Estática Magnética con Pantalla LCD', 'Reebok', 899.00, 1299.00, 31],
                ['Zapatillas Nike Revolution 6 Azul', 'Nike', 299.00, 399.00, 25],
            ],
        ];

        $productoId = 1;

        foreach ($productosPorCategoria as $categoriaNombre => $productos) {
            $categoriaId = $catIds[$categoriaNombre];

            foreach ($productos as $prod) {
                [$nombre, $marcaNombre, $precioActual, $precioAnterior, $descuento] = $prod;
                $marcaId = $marcaIds[$marcaNombre];

                // Insertar producto
                DB::table('producto')->insert([
                    'id' => $productoId,
                    'marca_id' => $marcaId,
                    'nombre' => $nombre,
                    'descripcion' => "Producto de alta calidad de la marca {$marcaNombre}. {$nombre}.",
                    'sku_base' => 'SKU-' . strtoupper(substr(md5($nombre), 0, 8)),
                    'activo' => 1,
                ]);

                // Relación producto-categoría
                DB::table('producto_categoria')->insert([
                    'producto_id' => $productoId,
                    'categoria_id' => $categoriaId,
                ]);

                // Variante principal con precio actual
                DB::table('variante')->insert([
                    'producto_id' => $productoId,
                    'sku' => 'VAR-' . strtoupper(substr(md5($nombre . '-var'), 0, 8)),
                    'precio' => $precioActual,
                    'activo' => 1,
                ]);

                // Imagen del producto
                DB::table('producto_imagen')->insert([
                    'producto_id' => $productoId,
                    'url' => $defaultImage,
                    'orden' => 1,
                ]);

                // Historial de precio (precio anterior)
                DB::table('historial_precio')->insert([
                    'producto_id' => $productoId,
                    'precio' => $precioAnterior,
                    'fecha_inicio' => now()->subMonths(3)->toDateTimeString(),
                    'fecha_fin' => now()->subDay()->toDateTimeString(),
                ]);

                $productoId++;
            }
        }

        // ========== PROMOCIÓN "Lo mejor de la semana" ==========
        DB::table('promocion')->insert([
            'id' => 1,
            'nombre' => 'Lo mejor de la semana',
            'fecha_inicio' => now()->startOfWeek()->toDateString(),
            'fecha_fin' => now()->endOfWeek()->toDateString(),
            'activa' => 1,
        ]);

        // Asignar los primeros 5 productos (uno de cada categoría variada) a la promoción
        $promoProductos = [1, 6, 11, 16, 21]; // Televisores, Electrohogar, Computación, Celulares, Audio
        foreach ($promoProductos as $pId) {
            DB::table('promocion_producto')->insert([
                'promocion_id' => 1,
                'producto_id' => $pId,
            ]);
        }

        // Regla de promoción
        DB::table('regla_promocion')->insert([
            'promocion_id' => 1,
            'tipo' => 'descuento_porcentaje',
            'valor' => 25.00,
            'minimo_compra' => 0.00,
        ]);
    }
}
