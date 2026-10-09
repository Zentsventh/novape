<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Producto;
use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Variante;
use App\Models\ProductoImagen;
use App\Models\HistorialPrecio;
use Illuminate\Support\Facades\DB;

class ProductosElectrohogarSeeder extends Seeder
{
    private $imagen = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGcz-ggP3b6rK46wzS4_HcheXRUabUB0BnKQ&s';

    public function run(): void
    {
        // Agregar marcas de electrohogar que faltan
        $marcasNuevas = ['Sole', 'Coldex', 'Miray', 'Imaco', 'Bosch', 'Rotoplas', 'Midea', 'Daewoo', 'Rinnai', 'Klimatic', 'Thomas', 'Black+Decker', 'Philips', 'Cuisinart', 'Karcher'];
        foreach ($marcasNuevas as $nombre) {
            Marca::firstOrCreate(['nombre' => $nombre]);
        }

        // Obtener todas las marcas
        $marcas = Marca::pluck('id', 'nombre');

        // Obtener todas las categorías
        $categorias = Categoria::pluck('id', 'nombre');

        $productos = [
            // =============================================
            // REFRIGERACIÓN
            // =============================================
            ['nombre' => 'Refrigeradora LG Top Freezer 375L No Frost', 'marca' => 'LG', 'cat' => 'Refrigeradoras', 'precio' => 1899.00, 'precio_ant' => 2199.00, 'sku' => 'REF-LG-375'],
            ['nombre' => 'Refrigeradora Samsung Side by Side 600L', 'marca' => 'Samsung', 'cat' => 'Refrigeradoras', 'precio' => 3499.00, 'precio_ant' => 3999.00, 'sku' => 'REF-SAM-600'],
            ['nombre' => 'Refrigeradora Mabe 230L No Frost Silver', 'marca' => 'Mabe', 'cat' => 'Refrigeradoras', 'precio' => 1299.00, 'precio_ant' => 1599.00, 'sku' => 'REF-MAB-230'],
            ['nombre' => 'Refrigeradora Electrolux French Door 474L', 'marca' => 'Electrolux', 'cat' => 'Refrigeradoras', 'precio' => 4299.00, 'precio_ant' => 4999.00, 'sku' => 'REF-ELX-474'],
            ['nombre' => 'Refrigeradora Midea 207L Frost', 'marca' => 'Midea', 'cat' => 'Refrigeradoras', 'precio' => 899.00, 'precio_ant' => 1099.00, 'sku' => 'REF-MID-207'],

            ['nombre' => 'Congeladora Electrolux Horizontal 295L', 'marca' => 'Electrolux', 'cat' => 'Congeladoras', 'precio' => 1399.00, 'precio_ant' => 1699.00, 'sku' => 'CON-ELX-295'],
            ['nombre' => 'Congeladora Coldex Vertical 168L', 'marca' => 'Coldex', 'cat' => 'Congeladoras', 'precio' => 999.00, 'precio_ant' => 1199.00, 'sku' => 'CON-COL-168'],

            ['nombre' => 'Dispensador de Agua Sole 3 Temperaturas', 'marca' => 'Sole', 'cat' => 'Dispensadores y purificadores', 'precio' => 349.00, 'precio_ant' => 449.00, 'sku' => 'DIS-SOL-3T'],
            ['nombre' => 'Purificador de Agua Rotoplas', 'marca' => 'Rotoplas', 'cat' => 'Dispensadores y purificadores', 'precio' => 179.00, 'precio_ant' => 249.00, 'sku' => 'PUR-ROT-01'],

            ['nombre' => 'Frigobar Electrolux 90L Silver', 'marca' => 'Electrolux', 'cat' => 'Frigobares y vineras', 'precio' => 599.00, 'precio_ant' => 749.00, 'sku' => 'FRG-ELX-90'],
            ['nombre' => 'Frigobar Miray 93L Inox', 'marca' => 'Miray', 'cat' => 'Frigobares y vineras', 'precio' => 529.00, 'precio_ant' => 649.00, 'sku' => 'FRG-MIR-93'],

            ['nombre' => 'Exhibidor Vertical Sole 350L', 'marca' => 'Sole', 'cat' => 'Exhibidores y vitrinas', 'precio' => 1899.00, 'precio_ant' => 2299.00, 'sku' => 'EXH-SOL-350'],

            // =============================================
            // COCINA
            // =============================================
            ['nombre' => 'Cocina de Pie Mabe 6 Hornillas Inox', 'marca' => 'Mabe', 'cat' => 'Cocinas de pie', 'precio' => 1599.00, 'precio_ant' => 1899.00, 'sku' => 'COC-MAB-6H'],
            ['nombre' => 'Cocina de Pie Sole 4 Hornillas Blanca', 'marca' => 'Sole', 'cat' => 'Cocinas de pie', 'precio' => 799.00, 'precio_ant' => 999.00, 'sku' => 'COC-SOL-4H'],
            ['nombre' => 'Cocina de Pie Indurama 5 Hornillas', 'marca' => 'Indurama', 'cat' => 'Cocinas de pie', 'precio' => 1299.00, 'precio_ant' => 1499.00, 'sku' => 'COC-IND-5H'],

            ['nombre' => 'Cocina Empotrable Sole 4 Quemadores', 'marca' => 'Sole', 'cat' => 'Cocinas empotrables', 'precio' => 649.00, 'precio_ant' => 799.00, 'sku' => 'EMP-SOL-4Q'],
            ['nombre' => 'Cocina Empotrable Klimatic Vitrocerámica', 'marca' => 'Klimatic', 'cat' => 'Cocinas empotrables', 'precio' => 899.00, 'precio_ant' => 1099.00, 'sku' => 'EMP-KLI-VC'],

            ['nombre' => 'Cocina de Mesa Sole 2 Hornillas', 'marca' => 'Sole', 'cat' => 'Cocinas de mesa', 'precio' => 189.00, 'precio_ant' => 249.00, 'sku' => 'MES-SOL-2H'],

            ['nombre' => 'Campana Extractora Sole 60cm Inox', 'marca' => 'Sole', 'cat' => 'Campanas', 'precio' => 399.00, 'precio_ant' => 549.00, 'sku' => 'CAM-SOL-60'],
            ['nombre' => 'Campana Klimatic Decorativa 90cm', 'marca' => 'Klimatic', 'cat' => 'Campanas', 'precio' => 799.00, 'precio_ant' => 999.00, 'sku' => 'CAM-KLI-90'],

            ['nombre' => 'Horno Empotrable Sole 60cm Gas', 'marca' => 'Sole', 'cat' => 'Hornos empotrables', 'precio' => 699.00, 'precio_ant' => 899.00, 'sku' => 'HOR-SOL-60'],
            ['nombre' => 'Horno Empotrable Electrolux 73L Eléctrico', 'marca' => 'Electrolux', 'cat' => 'Hornos empotrables', 'precio' => 1299.00, 'precio_ant' => 1599.00, 'sku' => 'HOR-ELX-73'],

            ['nombre' => 'Combo Cocina + Campana + Horno Sole', 'marca' => 'Sole', 'cat' => 'Combos de cocina', 'precio' => 1799.00, 'precio_ant' => 2299.00, 'sku' => 'CMB-SOL-01'],

            // =============================================
            // LAVADO
            // =============================================
            ['nombre' => 'Lavadora LG Carga Superior 13kg', 'marca' => 'LG', 'cat' => 'Lavadoras', 'precio' => 1399.00, 'precio_ant' => 1699.00, 'sku' => 'LAV-LG-13'],
            ['nombre' => 'Lavadora Samsung Carga Frontal 15kg', 'marca' => 'Samsung', 'cat' => 'Lavadoras', 'precio' => 1999.00, 'precio_ant' => 2399.00, 'sku' => 'LAV-SAM-15'],
            ['nombre' => 'Lavadora Electrolux 10.5kg Essential Care', 'marca' => 'Electrolux', 'cat' => 'Lavadoras', 'precio' => 1099.00, 'precio_ant' => 1399.00, 'sku' => 'LAV-ELX-10'],
            ['nombre' => 'Lavadora Mabe 16kg Aqua Saver Green', 'marca' => 'Mabe', 'cat' => 'Lavadoras', 'precio' => 1199.00, 'precio_ant' => 1499.00, 'sku' => 'LAV-MAB-16'],
            ['nombre' => 'Lavadora Midea 8kg Blanca', 'marca' => 'Midea', 'cat' => 'Lavadoras', 'precio' => 799.00, 'precio_ant' => 999.00, 'sku' => 'LAV-MID-8'],

            ['nombre' => 'Lavaseca LG 12kg/7kg Carga Frontal', 'marca' => 'LG', 'cat' => 'Lavasecas', 'precio' => 2799.00, 'precio_ant' => 3199.00, 'sku' => 'LS-LG-12'],
            ['nombre' => 'Lavaseca Samsung 11.5kg/7kg AddWash', 'marca' => 'Samsung', 'cat' => 'Lavasecas', 'precio' => 2599.00, 'precio_ant' => 2999.00, 'sku' => 'LS-SAM-11'],

            ['nombre' => 'Secadora Electrolux 10.5kg Sensor Dry', 'marca' => 'Electrolux', 'cat' => 'Secadoras', 'precio' => 1699.00, 'precio_ant' => 1999.00, 'sku' => 'SEC-ELX-10'],

            ['nombre' => 'Centro de Lavado Mabe 20kg/12kg', 'marca' => 'Mabe', 'cat' => 'Centros de lavado', 'precio' => 2899.00, 'precio_ant' => 3499.00, 'sku' => 'CL-MAB-20'],

            ['nombre' => 'Lavavajillas Bosch 14 Servicios Inox', 'marca' => 'Bosch', 'cat' => 'Lavavajillas', 'precio' => 2499.00, 'precio_ant' => 2999.00, 'sku' => 'LV-BOS-14'],

            // =============================================
            // CLIMATIZACIÓN
            // =============================================
            ['nombre' => 'Ventilador de Pie Miray 18" 3 Velocidades', 'marca' => 'Miray', 'cat' => 'Ventiladores', 'precio' => 129.00, 'precio_ant' => 169.00, 'sku' => 'VEN-MIR-18'],
            ['nombre' => 'Ventilador de Torre Imaco 40" Digital', 'marca' => 'Imaco', 'cat' => 'Ventiladores', 'precio' => 199.00, 'precio_ant' => 269.00, 'sku' => 'VEN-IMA-40'],
            ['nombre' => 'Ventilador de Pared Sole 16" Oscilante', 'marca' => 'Sole', 'cat' => 'Ventiladores', 'precio' => 89.00, 'precio_ant' => 119.00, 'sku' => 'VEN-SOL-16'],

            ['nombre' => 'Aire Acondicionado LG Split 12000BTU Inverter', 'marca' => 'LG', 'cat' => 'Aires acondicionados', 'precio' => 1899.00, 'precio_ant' => 2299.00, 'sku' => 'AC-LG-12K'],
            ['nombre' => 'Aire Acondicionado Samsung 18000BTU', 'marca' => 'Samsung', 'cat' => 'Aires acondicionados', 'precio' => 2499.00, 'precio_ant' => 2999.00, 'sku' => 'AC-SAM-18K'],
            ['nombre' => 'Aire Acondicionado Midea 9000BTU', 'marca' => 'Midea', 'cat' => 'Aires acondicionados', 'precio' => 1299.00, 'precio_ant' => 1599.00, 'sku' => 'AC-MID-9K'],

            ['nombre' => 'Terma Eléctrica Sole 80L', 'marca' => 'Sole', 'cat' => 'Termas y rapiduchas', 'precio' => 549.00, 'precio_ant' => 699.00, 'sku' => 'TER-SOL-80'],
            ['nombre' => 'Terma a Gas Rinnai 10L', 'marca' => 'Rinnai', 'cat' => 'Termas y rapiduchas', 'precio' => 799.00, 'precio_ant' => 999.00, 'sku' => 'TER-RIN-10'],

            ['nombre' => 'Deshumecedor Midea 20L/día', 'marca' => 'Midea', 'cat' => 'Deshumecedores', 'precio' => 699.00, 'precio_ant' => 899.00, 'sku' => 'DES-MID-20'],

            ['nombre' => 'Calentador Eléctrico Sole 3 Barras', 'marca' => 'Sole', 'cat' => 'Calentadores y estufas', 'precio' => 149.00, 'precio_ant' => 199.00, 'sku' => 'CAL-SOL-3B'],

            // =============================================
            // LIMPIEZA
            // =============================================
            ['nombre' => 'Aspiradora Robot Samsung POWERbot', 'marca' => 'Samsung', 'cat' => 'Aspiradoras', 'precio' => 1299.00, 'precio_ant' => 1599.00, 'sku' => 'ASP-SAM-RB'],
            ['nombre' => 'Aspiradora Inalámbrica Thomas TH-1130', 'marca' => 'Thomas', 'cat' => 'Aspiradoras', 'precio' => 399.00, 'precio_ant' => 549.00, 'sku' => 'ASP-THO-11'],
            ['nombre' => 'Aspiradora Electrolux 1600W', 'marca' => 'Electrolux', 'cat' => 'Aspiradoras', 'precio' => 299.00, 'precio_ant' => 399.00, 'sku' => 'ASP-ELX-16'],

            ['nombre' => 'Hidrolavadora Karcher K2 1600PSI', 'marca' => 'Karcher', 'cat' => 'Hidrolavadoras', 'precio' => 499.00, 'precio_ant' => 649.00, 'sku' => 'HID-KAR-K2'],
            ['nombre' => 'Hidrolavadora Bosch EasyAquatak 120', 'marca' => 'Bosch', 'cat' => 'Hidrolavadoras', 'precio' => 599.00, 'precio_ant' => 749.00, 'sku' => 'HID-BOS-12'],

            ['nombre' => 'Lustradora Electrolux B800 Blanca', 'marca' => 'Electrolux', 'cat' => 'Lustradoras', 'precio' => 349.00, 'precio_ant' => 449.00, 'sku' => 'LUS-ELX-B8'],

            // =============================================
            // INDUSTRIAL
            // =============================================
            ['nombre' => 'Congeladora Conservadora Sole 520L', 'marca' => 'Sole', 'cat' => 'Congeladoras y conservadoras', 'precio' => 2899.00, 'precio_ant' => 3499.00, 'sku' => 'IND-SOL-520'],
            ['nombre' => 'Exhibidora Vertical Sole 450L Comercial', 'marca' => 'Sole', 'cat' => 'Exhibidoras y vitrinas', 'precio' => 2499.00, 'precio_ant' => 2999.00, 'sku' => 'IND-SOL-450'],

            // =============================================
            // ELECTRODOMÉSTICOS
            // =============================================
            ['nombre' => 'Licuadora Oster Pro 1200W 7 Velocidades', 'marca' => 'Oster', 'cat' => 'Licuadoras', 'precio' => 299.00, 'precio_ant' => 399.00, 'sku' => 'LIC-OST-12'],
            ['nombre' => 'Licuadora Philips HR2100 400W', 'marca' => 'Philips', 'cat' => 'Licuadoras', 'precio' => 149.00, 'precio_ant' => 199.00, 'sku' => 'LIC-PHI-HR'],
            ['nombre' => 'Licuadora Black+Decker Crush Master', 'marca' => 'Black+Decker', 'cat' => 'Licuadoras', 'precio' => 189.00, 'precio_ant' => 249.00, 'sku' => 'LIC-BD-CM'],

            ['nombre' => 'Horno Microondas Samsung 23L Silver', 'marca' => 'Samsung', 'cat' => 'Hornos microondas', 'precio' => 349.00, 'precio_ant' => 449.00, 'sku' => 'MIC-SAM-23'],
            ['nombre' => 'Horno Microondas LG NeoChef 42L', 'marca' => 'LG', 'cat' => 'Hornos microondas', 'precio' => 599.00, 'precio_ant' => 749.00, 'sku' => 'MIC-LG-42'],
            ['nombre' => 'Horno Microondas Electrolux 20L', 'marca' => 'Electrolux', 'cat' => 'Hornos microondas', 'precio' => 249.00, 'precio_ant' => 329.00, 'sku' => 'MIC-ELX-20'],

            ['nombre' => 'Freidora de Aire Oster Digital 4.2L', 'marca' => 'Oster', 'cat' => 'Freidoras de aire', 'precio' => 349.00, 'precio_ant' => 449.00, 'sku' => 'FRE-OST-42'],
            ['nombre' => 'Freidora de Aire Philips XL 6.2L', 'marca' => 'Philips', 'cat' => 'Freidoras de aire', 'precio' => 599.00, 'precio_ant' => 749.00, 'sku' => 'FRE-PHI-62'],
            ['nombre' => 'Freidora de Aire Black+Decker 5.5L', 'marca' => 'Black+Decker', 'cat' => 'Freidoras de aire', 'precio' => 279.00, 'precio_ant' => 349.00, 'sku' => 'FRE-BD-55'],
            ['nombre' => 'Freidora de Aire Miray 3.5L Digital', 'marca' => 'Miray', 'cat' => 'Freidoras de aire', 'precio' => 199.00, 'precio_ant' => 269.00, 'sku' => 'FRE-MIR-35'],

            ['nombre' => 'Olla Arrocera Oster 1.8L Antiadherente', 'marca' => 'Oster', 'cat' => 'Ollas arroceras', 'precio' => 149.00, 'precio_ant' => 199.00, 'sku' => 'OLL-OST-18'],
            ['nombre' => 'Olla Arrocera Imaco 2.8L 16 Tazas', 'marca' => 'Imaco', 'cat' => 'Ollas arroceras', 'precio' => 119.00, 'precio_ant' => 149.00, 'sku' => 'OLL-IMA-28'],

            ['nombre' => 'Extractor de Jugos Oster 600W', 'marca' => 'Oster', 'cat' => 'Extractores y exprimidores', 'precio' => 199.00, 'precio_ant' => 269.00, 'sku' => 'EXT-OST-60'],

            ['nombre' => 'Cafetera Oster PrimaLatte Espresso', 'marca' => 'Oster', 'cat' => 'Cafeteras', 'precio' => 499.00, 'precio_ant' => 649.00, 'sku' => 'CAF-OST-PL'],
            ['nombre' => 'Cafetera de Goteo Black+Decker 12 Tazas', 'marca' => 'Black+Decker', 'cat' => 'Cafeteras', 'precio' => 129.00, 'precio_ant' => 179.00, 'sku' => 'CAF-BD-12'],
            ['nombre' => 'Cafetera Cuisinart Grind & Brew', 'marca' => 'Cuisinart', 'cat' => 'Cafeteras', 'precio' => 799.00, 'precio_ant' => 999.00, 'sku' => 'CAF-CUI-GB'],

            ['nombre' => 'Batidora de Mano Oster 250W 5 Velocidades', 'marca' => 'Oster', 'cat' => 'Batidoras', 'precio' => 89.00, 'precio_ant' => 119.00, 'sku' => 'BAT-OST-25'],
            ['nombre' => 'Batidora Pedestal Imaco 5L 1000W', 'marca' => 'Imaco', 'cat' => 'Batidoras', 'precio' => 249.00, 'precio_ant' => 329.00, 'sku' => 'BAT-IMA-5L'],

            ['nombre' => 'Hervidor Eléctrico Miray 1.7L Inox', 'marca' => 'Miray', 'cat' => 'Hervidores', 'precio' => 69.00, 'precio_ant' => 99.00, 'sku' => 'HER-MIR-17'],
            ['nombre' => 'Hervidor Eléctrico Oster 1.7L Digital', 'marca' => 'Oster', 'cat' => 'Hervidores', 'precio' => 139.00, 'precio_ant' => 179.00, 'sku' => 'HER-OST-17'],

            ['nombre' => 'Tostadora Oster 4 Rebanadas', 'marca' => 'Oster', 'cat' => 'Tostadoras y sandwicheras', 'precio' => 129.00, 'precio_ant' => 169.00, 'sku' => 'TOS-OST-4R'],
            ['nombre' => 'Sandwichera Black+Decker 2 en 1', 'marca' => 'Black+Decker', 'cat' => 'Tostadoras y sandwicheras', 'precio' => 99.00, 'precio_ant' => 139.00, 'sku' => 'SAN-BD-2E'],

            ['nombre' => 'Horno Eléctrico Oster 42L Convección', 'marca' => 'Oster', 'cat' => 'Hornos eléctricos', 'precio' => 499.00, 'precio_ant' => 649.00, 'sku' => 'HEL-OST-42'],
            ['nombre' => 'Horno Eléctrico Imaco 60L', 'marca' => 'Imaco', 'cat' => 'Hornos eléctricos', 'precio' => 399.00, 'precio_ant' => 499.00, 'sku' => 'HEL-IMA-60'],

            ['nombre' => 'Parrilla Eléctrica Oster DuraCeramic', 'marca' => 'Oster', 'cat' => 'Parrillas eléctricas y grills', 'precio' => 249.00, 'precio_ant' => 329.00, 'sku' => 'PAR-OST-DC'],

            ['nombre' => 'Plancha a Vapor Black+Decker TrueGlide', 'marca' => 'Black+Decker', 'cat' => 'Planchas', 'precio' => 129.00, 'precio_ant' => 179.00, 'sku' => 'PLA-BD-TG'],
            ['nombre' => 'Plancha a Vapor Philips GC2990 2400W', 'marca' => 'Philips', 'cat' => 'Planchas', 'precio' => 189.00, 'precio_ant' => 249.00, 'sku' => 'PLA-PHI-GC'],
            ['nombre' => 'Plancha Oster Cerámica Antiadherente', 'marca' => 'Oster', 'cat' => 'Planchas', 'precio' => 99.00, 'precio_ant' => 139.00, 'sku' => 'PLA-OST-CA'],

            ['nombre' => 'Procesador de Alimentos Oster 10 Tazas', 'marca' => 'Oster', 'cat' => 'Procesadores y picatodos', 'precio' => 249.00, 'precio_ant' => 329.00, 'sku' => 'PRO-OST-10'],

            ['nombre' => 'Vaporizador de Prendas Philips GC340', 'marca' => 'Philips', 'cat' => 'Vaporizador de prendas', 'precio' => 249.00, 'precio_ant' => 349.00, 'sku' => 'VAP-PHI-GC'],

            ['nombre' => 'Máquina de Coser Singer M1505 Mecánica', 'marca' => 'Sole', 'cat' => 'Máquinas de coser', 'precio' => 499.00, 'precio_ant' => 649.00, 'sku' => 'COS-SIN-M1'],
        ];

        foreach ($productos as $data) {
            $marcaId = $marcas[$data['marca']] ?? null;
            $catId = $categorias[$data['cat']] ?? null;

            if (!$catId) continue;

            // Crear producto
            $producto = Producto::create([
                'nombre' => $data['nombre'],
                'marca_id' => $marcaId,
                'sku_base' => $data['sku'],
                'descripcion' => 'Producto de alta calidad para tu hogar. Garantía oficial de fábrica.',
                'activo' => true,
            ]);

            // Crear variante con precio
            Variante::create([
                'producto_id' => $producto->id,
                'sku' => $data['sku'],
                'precio' => $data['precio'],
                'activo' => true,
            ]);

            // Historial de precios (precio anterior para mostrar descuento)
            if (isset($data['precio_ant'])) {
                HistorialPrecio::create([
                    'producto_id' => $producto->id,
                    'precio' => $data['precio_ant'],
                    'fecha_inicio' => now()->subDays(30),
                    'fecha_fin' => now()->subDay(),
                ]);
            }

            // Historial de precios (precio actual)
            HistorialPrecio::create([
                'producto_id' => $producto->id,
                'precio' => $data['precio'],
                'fecha_inicio' => now(),
                'fecha_fin' => null,
            ]);

            // Imagen del producto
            ProductoImagen::create([
                'producto_id' => $producto->id,
                'url' => $this->imagen,
                'orden' => 0,
            ]);

            // Asociar con categoría
            $producto->categorias()->attach($catId);

            // También asociar con la categoría padre
            $catModel = Categoria::find($catId);
            if ($catModel && $catModel->categoria_padre_id) {
                $producto->categorias()->syncWithoutDetaching([$catModel->categoria_padre_id]);
            }
        }
    }
}
