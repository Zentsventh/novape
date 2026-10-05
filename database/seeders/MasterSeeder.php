<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;

class MasterSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Los datos de demostracion solo se pueden cargar en local o testing.');
        }

        $demoPassword = env('DEMO_SEED_PASSWORD');
        if (!is_string($demoPassword) || strlen($demoPassword) < 12) {
            throw new \RuntimeException('Configura DEMO_SEED_PASSWORD con al menos 12 caracteres.');
        }

        $now = Carbon::now();
        $password = Hash::make($demoPassword);

        // ═══════════════════════════════════════════
        // 1. PERMISOS (todos los que usan las rutas)
        // ═══════════════════════════════════════════
        $permisosData = [
            ['nombre' => 'ver_dashboard',        'descripcion' => 'Acceso al panel de control'],
            ['nombre' => 'ver_productos',        'descripcion' => 'Ver lista de productos e inventario'],
            ['nombre' => 'crear_producto',       'descripcion' => 'Crear nuevos productos'],
            ['nombre' => 'editar_producto',      'descripcion' => 'Editar productos existentes'],
            ['nombre' => 'eliminar_producto',    'descripcion' => 'Eliminar productos'],
            ['nombre' => 'ver_pedidos',          'descripcion' => 'Ver lista de pedidos y detalles'],
            ['nombre' => 'editar_pedido',        'descripcion' => 'Modificar estado de pedidos'],
            ['nombre' => 'ver_usuarios',         'descripcion' => 'Ver lista de clientes y usuarios'],
            ['nombre' => 'editar_usuario',       'descripcion' => 'Editar datos y bloquear usuarios'],
            ['nombre' => 'gestionar_ajustes',    'descripcion' => 'Modificar banners, roles y configuración'],
            ['nombre' => 'gestionar_cupones',    'descripcion' => 'Crear y editar cupones'],
            ['nombre' => 'gestionar_categorias', 'descripcion' => 'Crear y editar categorías'],
            ['nombre' => 'gestionar_marcas',     'descripcion' => 'Crear y editar marcas'],
            ['nombre' => 'ver_analiticas',       'descripcion' => 'Ver métricas y reportes'],
            ['nombre' => 'pos.vender',           'descripcion' => 'Acceso al módulo POS y ventas'],
            ['nombre' => 'inventario.gestionar', 'descripcion' => 'Ver y modificar inventario y almacenes'],
            ['nombre' => 'usuarios.gestionar',   'descripcion' => 'Crear, editar o eliminar usuarios y roles'],
            ['nombre' => 'reportes.ver',         'descripcion' => 'Ver métricas y reportes del dashboard'],
            ['nombre' => 'crm.gestionar', 'descripcion' => 'Acceder y modificar CRM'],
            ['nombre' => 'finanzas.gestionar', 'descripcion' => 'Acceder y modificar gastos'],
            ['nombre' => 'marketing.gestionar', 'descripcion' => 'Acceder y modificar campanas de marketing'],
        ];

        foreach ($permisosData as $p) {
            DB::table('permiso')->updateOrInsert(
                ['nombre' => $p['nombre']],
                ['descripcion' => $p['descripcion'], 'created_at' => $now, 'updated_at' => $now]
            );
        }
        $allPermisoIds = DB::table('permiso')->pluck('id', 'nombre');

        // ═══════════════════════════════════════════
        // 2. ROLES
        // ═══════════════════════════════════════════
        DB::table('usuario_rol')->truncate();
        DB::table('rol_permiso')->truncate();

        // Normalizar roles existentes con capitalización inconsistente
        DB::table('rol')->whereIn('nombre', ['Admin', 'Vendedor', 'Almacenero'])->delete();

        $rolesData = [
            'admin'   => 'Administrador (Control total)',
            'cajero'  => 'Cajero/Vendedor (Acceso al POS)',
            'almacen' => 'Almacenero (Acceso a compras e inventario)',
            'cliente' => 'Cliente registrado',
        ];

        $roleIds = [];
        foreach ($rolesData as $nombre => $desc) {
            DB::table('rol')->updateOrInsert(
                ['nombre' => $nombre],
                ['descripcion' => $desc, 'created_at' => $now, 'updated_at' => $now]
            );
            $roleIds[$nombre] = DB::table('rol')->where('nombre', $nombre)->first()->id;
        }

        // Admin: todos los permisos
        foreach ($allPermisoIds as $permisoId) {
            DB::table('rol_permiso')->insert(['rol_id' => $roleIds['admin'], 'permiso_id' => $permisoId]);
        }

        // Cajero: dashboard + POS + ver pedidos + ver usuarios
        $cajeroPermisos = ['ver_dashboard', 'pos.vender', 'ver_pedidos', 'ver_usuarios', 'ver_productos'];
        foreach ($cajeroPermisos as $pn) {
            if (isset($allPermisoIds[$pn])) {
                DB::table('rol_permiso')->insert(['rol_id' => $roleIds['cajero'], 'permiso_id' => $allPermisoIds[$pn]]);
            }
        }

        // Almacenero: dashboard + inventario + ver productos + crear/editar productos
        $almacenPermisos = ['ver_dashboard', 'inventario.gestionar', 'ver_productos', 'crear_producto', 'editar_producto'];
        foreach ($almacenPermisos as $pn) {
            if (isset($allPermisoIds[$pn])) {
                DB::table('rol_permiso')->insert(['rol_id' => $roleIds['almacen'], 'permiso_id' => $allPermisoIds[$pn]]);
            }
        }

        // ═══════════════════════════════════════════
        // 3. USUARIOS (Admin + Trabajadores + Clientes)
        // ═══════════════════════════════════════════
        $trabajadores = [
            ['nombres' => 'Eduardo', 'apellidos' => 'Capcha', 'email' => 'admin@novape.com', 'tipo_documento' => 'DNI', 'dni' => '12345678', 'telefono' => '987654321', 'rol' => 'admin'],
            ['nombres' => 'María', 'apellidos' => 'Pérez', 'email' => 'cajero@novape.com', 'tipo_documento' => 'DNI', 'dni' => '87654321', 'telefono' => '999888777', 'rol' => 'cajero'],
            ['nombres' => 'Carlos', 'apellidos' => 'Ramírez', 'email' => 'almacen@novape.com', 'tipo_documento' => 'DNI', 'dni' => '44556677', 'telefono' => '911222333', 'rol' => 'almacen'],
        ];

        $userIds = [];
        foreach ($trabajadores as $t) {
            $user = DB::table('usuario')->where('email', $t['email'])->first();
            if ($user) {
                $userId = $user->id;
                DB::table('usuario')->where('id', $userId)->update([
                    'nombres' => $t['nombres'], 'apellidos' => $t['apellidos'],
                    'tipo_documento' => $t['tipo_documento'], 'dni' => $t['dni'],
                    'telefono' => $t['telefono'], 'password_hash' => $password,
                    'estado' => 'activo', 'updated_at' => $now,
                ]);
            } else {
                $userId = DB::table('usuario')->insertGetId([
                    'nombres' => $t['nombres'], 'apellidos' => $t['apellidos'],
                    'tipo_documento' => $t['tipo_documento'], 'dni' => $t['dni'],
                    'email' => $t['email'], 'telefono' => $t['telefono'],
                    'password_hash' => $password, 'estado' => 'activo',
                    'created_at' => $now, 'updated_at' => $now,
                ]);
            }
            $userIds[$t['email']] = $userId;
            DB::table('usuario_rol')->insert(['usuario_id' => $userId, 'rol_id' => $roleIds[$t['rol']]]);
        }

        // Clientes
        $clientesData = [
            ['nombres' => 'Ana',     'apellidos' => 'Perez',     'dni' => '70123456', 'email' => 'ana.perez@gmail.com', 'telefono' => '912345678'],
            ['nombres' => 'Jorge',   'apellidos' => 'López',     'dni' => '70123457', 'email' => 'jorge.lopez@hotmail.com', 'telefono' => '923456789'],
            ['nombres' => 'Lucía',   'apellidos' => 'Fernández', 'dni' => '70123458', 'email' => 'lucia.fer@yahoo.com', 'telefono' => '934567890'],
            ['nombres' => 'Pedro',   'apellidos' => 'Castillo',  'dni' => '70123459', 'email' => 'pedro.cas@gmail.com', 'telefono' => '945678901'],
            ['nombres' => 'Marta',   'apellidos' => 'Sánchez',   'dni' => '70123460', 'email' => 'marta.san@gmail.com', 'telefono' => '956789012'],
            ['nombres' => 'Luis',    'apellidos' => 'Gómez',     'dni' => '70123461', 'email' => 'luis.gom@outlook.com', 'telefono' => '967890123'],
            ['nombres' => 'Carmen',  'apellidos' => 'Díaz',      'dni' => '70123462', 'email' => 'carmen.diaz@gmail.com', 'telefono' => '978901234'],
            ['nombres' => 'Raúl',    'apellidos' => 'Torres',    'dni' => '70123463', 'email' => 'raul.torres@gmail.com', 'telefono' => '989012345'],
            ['nombres' => 'Rosa',    'apellidos' => 'Ruíz',      'dni' => '70123464', 'email' => 'rosa.ruiz@gmail.com', 'telefono' => '990123456'],
            ['nombres' => 'Juan',    'apellidos' => 'Vargas',    'dni' => '70123465', 'email' => 'juan.vargas@gmail.com', 'telefono' => '901234567'],
        ];

        $clienteIds = [];
        foreach ($clientesData as $c) {
            $existing = DB::table('usuario')->where('email', $c['email'])->first();
            if ($existing) {
                $clienteIds[] = $existing->id;
            } else {
                $clienteIds[] = DB::table('usuario')->insertGetId([
                    'nombres' => $c['nombres'], 'apellidos' => $c['apellidos'],
                    'tipo_documento' => 'DNI', 'dni' => $c['dni'],
                    'email' => $c['email'], 'telefono' => $c['telefono'],
                    'password_hash' => $password, 'estado' => 'activo',
                    'created_at' => $now->copy()->subDays(rand(1, 60)), 'updated_at' => $now,
                ]);
            }
        }

        // Assign cliente role
        foreach ($clienteIds as $cid) {
            DB::table('usuario_rol')->updateOrInsert(
                ['usuario_id' => $cid, 'rol_id' => $roleIds['cliente']]
            );
        }

        // ═══════════════════════════════════════════
        // 4. MARCAS
        // ═══════════════════════════════════════════
        $marcasData = ['Apple', 'Samsung', 'Xiaomi', 'Sony', 'LG', 'HP', 'Lenovo', 'Asus', 'Nintendo'];
        $marcaIds = [];
        foreach ($marcasData as $m) {
            DB::table('marca')->updateOrInsert(['nombre' => $m], ['created_at' => $now, 'updated_at' => $now]);
            $marcaIds[$m] = DB::table('marca')->where('nombre', $m)->first()->id;
        }

        // ═══════════════════════════════════════════
        // 5. CATEGORÍAS
        // ═══════════════════════════════════════════
        $categoriasData = [
            'Celulares' => ['Apple', 'Samsung', 'Xiaomi'],
            'Cómputo' => ['Laptops', 'Tablets', 'Monitores'],
            'Mundo Gamer' => ['Laptops Gamer', 'Sillas gamer', 'Monitores Gamer'],
            'Audio' => ['Audífonos', 'Parlantes', 'Equipos de Sonido'],
            'TV' => ['Televisores', 'TVs menores a 43"', 'TVs mayores de 60"'],
            'Videojuegos' => ['Consolas', 'Play Station', 'Nintendo'],
            'Smartwatches' => ['Apple', 'Samsung', 'Xiaomi'],
        ];

        $catIds = [];
        foreach ($categoriasData as $padre => $subs) {
            DB::table('categoria')->updateOrInsert(
                ['nombre' => $padre, 'categoria_padre_id' => null],
                ['slug' => Str::slug($padre), 'descripcion' => 'Categoría de ' . $padre, 'activa' => true, 'created_at' => $now, 'updated_at' => $now]
            );
            $padreId = DB::table('categoria')->where('nombre', $padre)->whereNull('categoria_padre_id')->first()->id;
            $catIds[$padre] = $padreId;

            foreach ($subs as $sub) {
                DB::table('categoria')->updateOrInsert(
                    ['nombre' => $sub, 'categoria_padre_id' => $padreId],
                    ['slug' => Str::slug($padre . ' ' . $sub), 'descripcion' => 'Subcategoría ' . $sub, 'activa' => true, 'created_at' => $now, 'updated_at' => $now]
                );
            }
        }

        // ═══════════════════════════════════════════
        // 6. PROVEEDORES
        // ═══════════════════════════════════════════
        $proveedores = [
            ['nombre' => 'TechNova S.A.', 'ruc' => '20123456781', 'direccion' => 'Av. Tecnológica 123, Lima', 'telefono' => '01-123-4567', 'email' => 'ventas@technova.com.pe', 'contacto' => 'Juan Pérez', 'activo' => true],
            ['nombre' => 'ElectroMundo Distribuciones', 'ruc' => '20987654321', 'direccion' => 'Calle Principal 456, Arequipa', 'telefono' => '054-987-654', 'email' => 'contacto@electromundo.pe', 'contacto' => 'María Gómez', 'activo' => true],
            ['nombre' => 'Importaciones Globales SAC', 'ruc' => '20555555551', 'direccion' => 'Av. Industrial 789, Trujillo', 'telefono' => '999-888-777', 'email' => 'info@importglobal.com', 'contacto' => 'Carlos Ruiz', 'activo' => true],
            ['nombre' => 'MegaTech Perú', 'ruc' => '20333333331', 'direccion' => 'Jr. Puno 1000, Cercado de Lima', 'telefono' => '01-333-3333', 'email' => 'soporte@megatech.pe', 'contacto' => 'Ana Torres', 'activo' => true],
            ['nombre' => 'Innova Electrónica', 'ruc' => '20444444441', 'direccion' => 'Av. Javier Prado Este 234, San Isidro', 'telefono' => '01-444-4444', 'email' => 'ventas@innovaelec.pe', 'contacto' => 'Luis Fernández', 'activo' => true],
        ];

        $proveedorIds = [];
        foreach ($proveedores as $prov) {
            DB::table('proveedor')->updateOrInsert(['ruc' => $prov['ruc']], array_merge($prov, ['created_at' => $now, 'updated_at' => $now]));
            $proveedorIds[] = DB::table('proveedor')->where('ruc', $prov['ruc'])->first()->id;
        }

        // ═══════════════════════════════════════════
        // 7. PRODUCTOS (30 productos realistas)
        // ═══════════════════════════════════════════
        // Check if products already exist
        $existingProducts = DB::table('producto')->count();
        $productoIds = [];
        $varianteIds = [];

        if ($existingProducts < 10) {
            $productosData = [];

            // 10 iPhones
            for ($i = 1; $i <= 10; $i++) {
                $productosData[] = [
                    'nombre' => 'iPhone ' . (15 - ($i % 3)) . ' Pro ' . ($i * 128) . 'GB Edition ' . $i,
                    'marca' => 'Apple', 'catPadre' => 'Celulares',
                    'precio' => 4000.00 + ($i * 100), 'stock' => rand(5, 150),
                    'desc' => 'Descubre el poder del ecosistema Apple. Chip avanzado, pantalla Super Retina XDR, sistema de cámaras profesional y batería de larga duración.',
                    'img' => 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
                ];
            }

            // 10 Samsung
            for ($i = 1; $i <= 10; $i++) {
                $productosData[] = [
                    'nombre' => 'Samsung Galaxy S' . (24 - ($i % 3)) . ' Ultra ' . ($i * 128) . 'GB Variante ' . $i,
                    'marca' => 'Samsung', 'catPadre' => 'Celulares',
                    'precio' => 3500.00 + ($i * 80), 'stock' => rand(5, 150),
                    'desc' => 'Experiencia Galaxy definitiva. Cámara de 200MP, S Pen, pantalla Dynamic AMOLED 2X y rendimiento Snapdragon.',
                    'img' => 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
                ];
            }

            // 5 Laptops Lenovo
            for ($i = 1; $i <= 5; $i++) {
                $productosData[] = [
                    'nombre' => 'Lenovo Legion ' . (5 + $i) . 'i Pro Gen ' . $i,
                    'marca' => 'Lenovo', 'catPadre' => 'Cómputo',
                    'precio' => 4500.00 + ($i * 200), 'stock' => rand(3, 50),
                    'desc' => 'Laptop gaming Lenovo Legion. Procesador Intel i7/i9, NVIDIA RTX, refrigeración Coldfront y pantalla 165Hz.',
                    'img' => 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
                ];
            }

            // 5 Consolas Sony
            for ($i = 1; $i <= 5; $i++) {
                $productosData[] = [
                    'nombre' => 'PlayStation 5 Edición Especial ' . $i,
                    'marca' => 'Sony', 'catPadre' => 'Videojuegos',
                    'precio' => 2400.00 + ($i * 50), 'stock' => rand(10, 80),
                    'desc' => 'PS5 nueva generación. SSD ultrarrápido, retroalimentación háptica, audio 3D y gatillos adaptativos.',
                    'img' => 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
                ];
            }

            foreach ($productosData as $p) {
                $sku = strtoupper(substr($p['marca'], 0, 3)) . '-' . rand(1000, 9999);
                $slug = Str::slug($p['nombre']);

                // Avoid duplicate slugs
                $existingSlug = DB::table('producto')->where('slug', $slug)->exists();
                if ($existingSlug) $slug .= '-' . rand(100, 999);

                $prodId = DB::table('producto')->insertGetId([
                    'nombre' => $p['nombre'], 'slug' => $slug,
                    'descripcion' => $p['desc'], 'marca_id' => $marcaIds[$p['marca']],
                    'sku_base' => $sku, 'activo' => true,
                    'garantias' => '12 Meses de Garantía Novape',
                    'created_at' => $now->copy()->subDays(rand(1, 30)), 'updated_at' => $now,
                ]);
                $productoIds[] = $prodId;

                // Variante
                $varId = DB::table('variante')->insertGetId([
                    'producto_id' => $prodId, 'sku' => $sku . '-01',
                    'precio' => $p['precio'], 'atributos' => json_encode(['Color' => 'Estándar']),
                    'peso' => rand(5, 50) . '.00', 'stock' => $p['stock'],
                    'created_at' => $now, 'updated_at' => $now,
                ]);
                $varianteIds[] = $varId;

                // Imagen
                DB::table('producto_imagen')->insert([
                    'producto_id' => $prodId, 'url' => $p['img'], 'orden' => 1,
                ]);

                // Categoría
                if (isset($catIds[$p['catPadre']])) {
                    DB::table('producto_categoria')->insert([
                        'producto_id' => $prodId, 'categoria_id' => $catIds[$p['catPadre']],
                    ]);
                }
            }
        } else {
            // Reuse existing product/variant IDs
            $productoIds = DB::table('producto')->pluck('id')->toArray();
            $varianteIds = DB::table('variante')->pluck('id')->toArray();
        }

        // ═══════════════════════════════════════════
        // 8. ALMACENES
        // ═══════════════════════════════════════════
        $almacenes = [
            ['nombre' => 'Almacén Central Lima', 'direccion' => 'Av. Argentina 2500, Cercado de Lima', 'activo' => true],
            ['nombre' => 'Almacén Tienda Miraflores', 'direccion' => 'Av. Larco 345, Miraflores', 'activo' => true],
            ['nombre' => 'Almacén Tienda San Isidro', 'direccion' => 'Av. Javier Prado 800, San Isidro', 'activo' => true],
        ];

        $almacenIds = [];
        foreach ($almacenes as $a) {
            DB::table('almacenes')->updateOrInsert(['nombre' => $a['nombre']], array_merge($a, ['created_at' => $now, 'updated_at' => $now]));
            $almacenIds[] = DB::table('almacenes')->where('nombre', $a['nombre'])->first()->id;
        }

        // Stock por almacén
        if (count($varianteIds) > 0 && count($almacenIds) > 0) {
            foreach ($varianteIds as $vid) {
                foreach ($almacenIds as $aid) {
                    DB::table('stock_almacen')->updateOrInsert(
                        ['almacen_id' => $aid, 'variante_id' => $vid],
                        ['cantidad' => rand(5, 50), 'created_at' => $now, 'updated_at' => $now]
                    );
                }
            }
        }

        // ═══════════════════════════════════════════
        // 9. ZONAS DE ENVÍO
        // ═══════════════════════════════════════════
        $zonas = [
            ['nombre' => 'Lima Metropolitana', 'costo_envio' => 10.00, 'activo' => true, 'descripcion' => 'Envío en Lima y Callao'],
            ['nombre' => 'Provincias Costa', 'costo_envio' => 25.00, 'activo' => true, 'descripcion' => 'Ciudades de la costa peruana'],
            ['nombre' => 'Provincias Sierra', 'costo_envio' => 35.00, 'activo' => true, 'descripcion' => 'Ciudades de la sierra peruana'],
            ['nombre' => 'Provincias Selva', 'costo_envio' => 45.00, 'activo' => true, 'descripcion' => 'Ciudades de la selva peruana'],
        ];

        foreach ($zonas as $z) {
            DB::table('zonas')->updateOrInsert(['nombre' => $z['nombre']], array_merge($z, ['created_at' => $now, 'updated_at' => $now]));
        }

        // ═══════════════════════════════════════════
        // 10. MÉTODOS DE PAGO
        // ═══════════════════════════════════════════
        $metodosPago = [
            ['nombre' => 'Efectivo', 'detalles' => 'Pago en efectivo en tienda', 'activo' => true, 'tipo' => 'fisico', 'comision_porcentaje' => 0],
            ['nombre' => 'Yape', 'detalles' => 'Pago por Yape al 987654321', 'activo' => true, 'tipo' => 'digital', 'comision_porcentaje' => 0],
            ['nombre' => 'Plin', 'detalles' => 'Pago por Plin al 987654321', 'activo' => true, 'tipo' => 'digital', 'comision_porcentaje' => 0],
            ['nombre' => 'Tarjeta Visa/MC', 'detalles' => 'Pago con tarjeta de crédito o débito', 'activo' => true, 'tipo' => 'digital', 'comision_porcentaje' => 3.50],
            ['nombre' => 'Transferencia', 'detalles' => 'Transferencia bancaria BCP Cta. 123-456-789', 'activo' => true, 'tipo' => 'transferencia', 'comision_porcentaje' => 0],
        ];

        $metodoPagoIds = [];
        foreach ($metodosPago as $mp) {
            DB::table('metodos_pago')->updateOrInsert(['nombre' => $mp['nombre']], array_merge($mp, ['created_at' => $now, 'updated_at' => $now]));
            $metodoPagoIds[] = DB::table('metodos_pago')->where('nombre', $mp['nombre'])->first()->id;
        }

        // ═══════════════════════════════════════════
        // 11. PEDIDOS (variados estados y fechas)
        // ═══════════════════════════════════════════
        $existingPedidos = DB::table('pedido')->count();
        if ($existingPedidos < 5) {
            $estados = ['pendiente', 'procesando', 'enviado', 'completado', 'completado', 'completado', 'cancelado'];
            
            for ($i = 1; $i <= 25; $i++) {
                $estado = $estados[array_rand($estados)];
                $clienteId = $clienteIds[array_rand($clienteIds)];
                $fechaPedido = $now->copy()->subDays(rand(0, 45));
                $subtotal = rand(150, 8000) + (rand(0, 99) / 100);
                $descuento = rand(0, 1) ? round($subtotal * 0.1, 2) : 0;
                $total = round($subtotal - $descuento, 2);

                $pedidoId = DB::table('pedido')->insertGetId([
                    'usuario_id' => $clienteId,
                    'codigo' => 'NOV-' . str_pad($i, 6, '0', STR_PAD_LEFT),
                    'subtotal' => $subtotal,
                    'descuento' => $descuento,
                    'total' => $total,
                    'estado' => $estado,
                    'created_at' => $fechaPedido,
                    'updated_at' => $fechaPedido,
                ]);

                // Items del pedido (1-3 items por pedido)
                $numItems = rand(1, 3);
                for ($j = 0; $j < $numItems; $j++) {
                    if (count($varianteIds) === 0) break;
                    $varId = $varianteIds[array_rand($varianteIds)];
                    $variante = DB::table('variante')->find($varId);
                    if (!$variante) continue;

                    $qty = rand(1, 3);
                    DB::table('pedido_item')->insert([
                        'pedido_id' => $pedidoId,
                        'variante_id' => $varId,
                        'cantidad' => $qty,
                        'precio_unitario' => $variante->precio,
                        'created_at' => $fechaPedido,
                        'updated_at' => $fechaPedido,
                    ]);
                }

                // Pago si es completado
                if (in_array($estado, ['completado', 'enviado'])) {
                    DB::table('pago')->insert([
                        'pedido_id' => $pedidoId,
                        'metodo' => ['niubiz', 'yape', 'tarjeta'][array_rand([0, 1, 2])],
                        'estado' => 'completado',
                        'monto' => $total,
                        'created_at' => $fechaPedido,
                        'updated_at' => $fechaPedido,
                    ]);
                }
            }
        }

        // ═══════════════════════════════════════════
        // 12. VENTAS POS
        // ═══════════════════════════════════════════
        $existingVentasPos = DB::table('ventas_pos')->count();
        if ($existingVentasPos < 5) {
            $adminId = $userIds['admin@novape.com'];
            $cajeroId = $userIds['cajero@novape.com'];

            for ($i = 1; $i <= 20; $i++) {
                $fechaVenta = $now->copy()->subDays(rand(0, 30));
                $cajeroVenta = rand(0, 1) ? $adminId : $cajeroId;
                $metPagoId = $metodoPagoIds[array_rand($metodoPagoIds)];

                $subtotalPos = 0;
                $itemsPos = [];
                $numItems = rand(1, 4);
                for ($j = 0; $j < $numItems; $j++) {
                    if (count($varianteIds) === 0) break;
                    $varId = $varianteIds[array_rand($varianteIds)];
                    $variante = DB::table('variante')->find($varId);
                    $producto = $variante ? DB::table('producto')->find($variante->producto_id) : null;
                    if (!$variante || !$producto) continue;

                    $qty = rand(1, 3);
                    $itemSubtotal = round($variante->precio * $qty, 2);
                    $subtotalPos += $itemSubtotal;

                    $itemsPos[] = [
                        'variante_id' => $varId,
                        'producto_nombre' => $producto->nombre,
                        'cantidad' => $qty,
                        'precio_unitario' => $variante->precio,
                        'subtotal' => $itemSubtotal,
                    ];
                }

                if (empty($itemsPos)) continue;

                $igv = round($subtotalPos * 0.18, 2);
                $totalPos = round($subtotalPos + $igv, 2);

                $ventaPosId = DB::table('ventas_pos')->insertGetId([
                    'codigo_ticket' => 'T001-' . str_pad($i, 8, '0', STR_PAD_LEFT),
                    'cajero_id' => $cajeroVenta,
                    'metodo_pago_id' => $metPagoId,
                    'subtotal' => $subtotalPos,
                    'igv' => $igv,
                    'total' => $totalPos,
                    'tipo_comprobante' => rand(0, 1) ? 'boleta' : 'factura',
                    'created_at' => $fechaVenta,
                    'updated_at' => $fechaVenta,
                ]);

                foreach ($itemsPos as $item) {
                    DB::table('venta_pos_items')->insert(array_merge($item, [
                        'venta_pos_id' => $ventaPosId,
                        'created_at' => $fechaVenta,
                        'updated_at' => $fechaVenta,
                    ]));
                }
            }
        }

        // ═══════════════════════════════════════════
        // 13. COMPRAS A PROVEEDORES
        // ═══════════════════════════════════════════
        $existingCompras = DB::table('compras')->count();
        if ($existingCompras < 3) {
            for ($i = 1; $i <= 8; $i++) {
                $fechaCompra = $now->copy()->subDays(rand(5, 40));
                $provId = $proveedorIds[array_rand($proveedorIds)];
                $estadoCompra = ['completado', 'completado', 'completado', 'pendiente'][array_rand([0, 1, 2, 3])];

                $totalCompra = 0;
                $compraItems = [];
                $numItems = rand(2, 5);
                for ($j = 0; $j < $numItems; $j++) {
                    if (count($varianteIds) === 0) break;
                    $varId = $varianteIds[array_rand($varianteIds)];
                    $variante = DB::table('variante')->find($varId);
                    if (!$variante) continue;

                    $qty = rand(5, 30);
                    $costoUnit = round($variante->precio * 0.6, 2); // 60% del precio de venta
                    $subCompra = round($costoUnit * $qty, 2);
                    $totalCompra += $subCompra;

                    $compraItems[] = [
                        'producto_id' => $variante->producto_id,
                        'variante_id' => $varId,
                        'cantidad' => $qty,
                        'costo_unitario' => $costoUnit,
                        'subtotal' => $subCompra,
                    ];
                }

                if (empty($compraItems)) continue;

                $compraId = DB::table('compras')->insertGetId([
                    'proveedor_id' => $provId,
                    'total' => $totalCompra,
                    'estado' => $estadoCompra,
                    'fecha_compra' => $fechaCompra->toDateString(),
                    'numero_orden' => 'OC-' . str_pad($i, 5, '0', STR_PAD_LEFT),
                    'notas' => 'Compra de reposición de stock #' . $i,
                    'created_at' => $fechaCompra,
                    'updated_at' => $fechaCompra,
                ]);

                foreach ($compraItems as $ci) {
                    DB::table('compra_items')->insert(array_merge($ci, [
                        'compra_id' => $compraId,
                        'created_at' => $fechaCompra,
                        'updated_at' => $fechaCompra,
                    ]));
                }
            }
        }

        // ═══════════════════════════════════════════
        // 14. GASTOS OPERATIVOS
        // ═══════════════════════════════════════════
        $existingGastos = DB::table('gastos')->count();
        if ($existingGastos < 3) {
            $gastosData = [
                ['concepto' => 'Alquiler Local Miraflores - Julio', 'monto' => 4500.00, 'categoria' => 'alquiler', 'tipo' => 'fijo', 'dias' => 5],
                ['concepto' => 'Servicio de Electricidad - Julio', 'monto' => 850.00, 'categoria' => 'servicios', 'tipo' => 'variable', 'dias' => 10],
                ['concepto' => 'Servicio de Internet Fibra 300Mbps', 'monto' => 220.00, 'categoria' => 'servicios', 'tipo' => 'fijo', 'dias' => 8],
                ['concepto' => 'Servicio de Agua - Julio', 'monto' => 180.00, 'categoria' => 'servicios', 'tipo' => 'variable', 'dias' => 12],
                ['concepto' => 'Sueldo Personal Tienda (3 personas)', 'monto' => 6000.00, 'categoria' => 'sueldos', 'tipo' => 'fijo', 'dias' => 2],
                ['concepto' => 'Mantenimiento PC/Sistemas', 'monto' => 350.00, 'categoria' => 'mantenimiento', 'tipo' => 'variable', 'dias' => 15],
                ['concepto' => 'Material de Limpieza y Oficina', 'monto' => 120.00, 'categoria' => 'operativo', 'tipo' => 'variable', 'dias' => 20],
                ['concepto' => 'Seguro contra Robos', 'monto' => 500.00, 'categoria' => 'seguros', 'tipo' => 'fijo', 'dias' => 1],
                ['concepto' => 'Publicidad Google/Meta Ads - Julio', 'monto' => 1200.00, 'categoria' => 'marketing', 'tipo' => 'variable', 'dias' => 7],
                ['concepto' => 'Alquiler Local Miraflores - Junio', 'monto' => 4500.00, 'categoria' => 'alquiler', 'tipo' => 'fijo', 'dias' => 35],
                ['concepto' => 'Sueldo Personal Tienda Junio', 'monto' => 6000.00, 'categoria' => 'sueldos', 'tipo' => 'fijo', 'dias' => 32],
                ['concepto' => 'Electricidad - Junio', 'monto' => 780.00, 'categoria' => 'servicios', 'tipo' => 'variable', 'dias' => 40],
            ];

            foreach ($gastosData as $g) {
                DB::table('gastos')->insert([
                    'concepto' => $g['concepto'],
                    'monto' => $g['monto'],
                    'categoria' => $g['categoria'],
                    'tipo' => $g['tipo'],
                    'fecha_gasto' => $now->copy()->subDays($g['dias'])->toDateString(),
                    'created_at' => $now->copy()->subDays($g['dias']),
                    'updated_at' => $now->copy()->subDays($g['dias']),
                ]);
            }
        }

        // ═══════════════════════════════════════════
        // 15. BANNERS
        // ═══════════════════════════════════════════
        $existingBanners = DB::table('banners')->count();
        if ($existingBanners < 5) {
            DB::table('banners')->truncate(); // Clean up existing to insert these 5
            $banners = [
                [
                    'titulo' => 'Especial Telefonía',
                    'subtitulo' => 'Descubre los mejores smartphones',
                    'imagen_url' => '/images/banners/1784249178_efe-slider-b2c-02-telefonia-01_2_.webp',
                    'enlace_url' => '/catalogo?categoria=celulares',
                    'posicion' => 'hero', 'orden' => 1, 'activo' => true,
                    'fecha_inicio' => $now->copy()->subDays(5)->toDateTimeString(),
                    'fecha_fin' => $now->copy()->addDays(30)->toDateTimeString(),
                ],
                [
                    'titulo' => 'Nuevos Modelos',
                    'subtitulo' => 'Renueva tu equipo hoy',
                    'imagen_url' => '/images/banners/1784249730_efe-slider-b2c-02-telefonia-01_2_.webp',
                    'enlace_url' => '/catalogo?categoria=celulares',
                    'posicion' => 'hero', 'orden' => 2, 'activo' => true,
                    'fecha_inicio' => $now->copy()->subDays(3)->toDateTimeString(),
                    'fecha_fin' => $now->copy()->addDays(25)->toDateTimeString(),
                ],
                [
                    'titulo' => 'Electrodomésticos',
                    'subtitulo' => 'Equipa tu hogar con lo mejor',
                    'imagen_url' => '/images/banners/banner_electrodomesticos.png',
                    'enlace_url' => '/catalogo?categoria=electrodomesticos',
                    'posicion' => 'hero', 'orden' => 3, 'activo' => true,
                    'fecha_inicio' => $now->copy()->subDays(1)->toDateTimeString(),
                    'fecha_fin' => $now->copy()->addDays(20)->toDateTimeString(),
                ],
                [
                    'titulo' => 'Línea Blanca',
                    'subtitulo' => 'Ofertas en refrigeración y lavado',
                    'imagen_url' => '/images/banners/banner_linea_blanca.png',
                    'enlace_url' => '/catalogo?categoria=linea-blanca',
                    'posicion' => 'hero', 'orden' => 4, 'activo' => true,
                    'fecha_inicio' => $now->copy()->toDateTimeString(),
                    'fecha_fin' => $now->copy()->addDays(30)->toDateTimeString(),
                ],
                [
                    'titulo' => 'Samsung Galaxy',
                    'subtitulo' => 'La nueva generación ya está aquí',
                    'imagen_url' => '/images/banners/banner_samsung_galaxy.png',
                    'enlace_url' => '/catalogo?marca=samsung',
                    'posicion' => 'hero', 'orden' => 5, 'activo' => true,
                    'fecha_inicio' => $now->copy()->toDateTimeString(),
                    'fecha_fin' => $now->copy()->addDays(15)->toDateTimeString(),
                ],
            ];

            foreach ($banners as $b) {
                DB::table('banners')->insert(array_merge($b, ['created_at' => $now, 'updated_at' => $now]));
            }
        }

        // ═══════════════════════════════════════════
        // 16. CUPONES
        // ═══════════════════════════════════════════
        $existingCupones = DB::table('cupones')->count();
        if ($existingCupones < 1) {
            $cupones = [
                ['codigo' => 'BIENVENIDO10', 'tipo' => 'porcentaje', 'valor' => 10.00, 'monto_minimo' => 100.00, 'fecha_inicio' => $now->copy()->subDays(10)->toDateTimeString(), 'fecha_fin' => $now->copy()->addDays(60)->toDateTimeString(), 'limite_usos' => 100, 'usos_actuales' => 12, 'activo' => true],
                ['codigo' => 'CYBER50', 'tipo' => 'fijo', 'valor' => 50.00, 'monto_minimo' => 500.00, 'fecha_inicio' => $now->copy()->subDays(5)->toDateTimeString(), 'fecha_fin' => $now->copy()->addDays(15)->toDateTimeString(), 'limite_usos' => 50, 'usos_actuales' => 5, 'activo' => true],
                ['codigo' => 'ENVIOGRATIS', 'tipo' => 'fijo', 'valor' => 15.00, 'monto_minimo' => 200.00, 'fecha_inicio' => $now->copy()->subDays(20)->toDateTimeString(), 'fecha_fin' => $now->copy()->addDays(40)->toDateTimeString(), 'limite_usos' => null, 'usos_actuales' => 35, 'activo' => true],
                ['codigo' => 'VIP20', 'tipo' => 'porcentaje', 'valor' => 20.00, 'monto_minimo' => 1000.00, 'fecha_inicio' => $now->copy()->subDays(2)->toDateTimeString(), 'fecha_fin' => $now->copy()->addDays(30)->toDateTimeString(), 'limite_usos' => 20, 'usos_actuales' => 0, 'activo' => true],
                ['codigo' => 'VERANO2024', 'tipo' => 'porcentaje', 'valor' => 15.00, 'monto_minimo' => 300.00, 'fecha_inicio' => $now->copy()->subDays(60)->toDateTimeString(), 'fecha_fin' => $now->copy()->subDays(10)->toDateTimeString(), 'limite_usos' => 200, 'usos_actuales' => 187, 'activo' => false],
            ];

            foreach ($cupones as $cup) {
                DB::table('cupones')->insert(array_merge($cup, ['created_at' => $now, 'updated_at' => $now]));
            }
        }

        // ═══════════════════════════════════════════
        // 17. RESEÑAS
        // ═══════════════════════════════════════════
        if (count($productoIds) > 0 && count($clienteIds) > 0) {
            $existingResenas = DB::table('resenas')->count();
            if ($existingResenas < 3) {
                $comentarios = [
                    5 => ['Excelente producto, muy recomendable!', 'Superó mis expectativas, calidad premium.', 'Increíble, llegó antes de lo esperado.'],
                    4 => ['Muy buen producto, relación calidad-precio perfecta.', 'Buen rendimiento, solo le falta un poco de batería.', 'Contento con la compra, buen servicio.'],
                    3 => ['Cumple su función, nada del otro mundo.', 'Regular, esperaba mejor calidad por el precio.'],
                    2 => ['No cumplió mis expectativas completamente.', 'Llegó con algunos detalles de empaque.'],
                    1 => ['No recomendaría este producto.'],
                ];

                for ($i = 0; $i < 30; $i++) {
                    $calif = [5, 5, 5, 4, 4, 4, 4, 3, 3, 2][array_rand([0,1,2,3,4,5,6,7,8,9])];
                    $coments = $comentarios[$calif];
                    $prodId = $productoIds[array_rand($productoIds)];
                    $clienteId = $clienteIds[array_rand($clienteIds)];

                    // Avoid duplicate usuario-producto
                    $exists = DB::table('resenas')
                        ->where('producto_id', $prodId)
                        ->where('usuario_id', $clienteId)
                        ->exists();
                    if ($exists) continue;

                    DB::table('resenas')->insert([
                        'producto_id' => $prodId,
                        'usuario_id' => $clienteId,
                        'calificacion' => $calif,
                        'comentario' => $coments[array_rand($coments)],
                        'aprobado' => rand(0, 1),
                        'created_at' => $now->copy()->subDays(rand(1, 30)),
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        // ═══════════════════════════════════════════
        // 18. CONFIGURACIÓN DEL SITIO
        // ═══════════════════════════════════════════
        $configs = [
            ['clave' => 'nombre_tienda', 'valor' => 'Novape', 'descripcion' => 'Nombre de la tienda'],
            ['clave' => 'logo_url', 'valor' => '/images/logo.png', 'descripcion' => 'URL del logo'],
            ['clave' => 'envio_tarifa_plana', 'valor' => '15.00', 'descripcion' => 'Costo de envío estándar'],
            ['clave' => 'envio_gratis_minimo', 'valor' => '500.00', 'descripcion' => 'Monto mínimo para envío gratis'],
            ['clave' => 'facebook_url', 'valor' => 'https://facebook.com/novape', 'descripcion' => 'URL de Facebook'],
            ['clave' => 'instagram_url', 'valor' => 'https://instagram.com/novape', 'descripcion' => 'URL de Instagram'],
            ['clave' => 'tiktok_url', 'valor' => 'https://tiktok.com/@novape', 'descripcion' => 'URL de TikTok'],
            ['clave' => 'telefono_contacto', 'valor' => '+51 987 654 321', 'descripcion' => 'Teléfono principal'],
            ['clave' => 'email_contacto', 'valor' => 'contacto@novape.com', 'descripcion' => 'Email principal'],
            ['clave' => 'whatsapp_url', 'valor' => 'https://wa.me/51987654321', 'descripcion' => 'WhatsApp Business'],
            ['clave' => 'direccion_tienda', 'valor' => 'Av. Larco 345, Miraflores, Lima', 'descripcion' => 'Dirección física'],
            ['clave' => 'horario_atencion', 'valor' => 'Lun-Sáb: 9:00 AM - 8:00 PM', 'descripcion' => 'Horario de atención'],
            ['clave' => 'moneda', 'valor' => 'PEN', 'descripcion' => 'Moneda de la tienda'],
            ['clave' => 'igv_porcentaje', 'valor' => '18', 'descripcion' => 'Porcentaje de IGV'],
        ];

        foreach ($configs as $cfg) {
            DB::table('configuracion_sitio')->updateOrInsert(
                ['clave' => $cfg['clave']],
                ['valor' => $cfg['valor'], 'descripcion' => $cfg['descripcion']]
            );
        }

        $this->command->info('✅ MasterSeeder ejecutado exitosamente.');
        $this->command->info('   → Permisos: ' . DB::table('permiso')->count());
        $this->command->info('   → Roles: ' . DB::table('rol')->count());
        $this->command->info('   → Usuarios: ' . DB::table('usuario')->count());
        $this->command->info('   → Productos: ' . DB::table('producto')->count());
        $this->command->info('   → Pedidos: ' . DB::table('pedido')->count());
        $this->command->info('   → Ventas POS: ' . DB::table('ventas_pos')->count());
        $this->command->info('   → Compras: ' . DB::table('compras')->count());
        $this->command->info('   → Gastos: ' . DB::table('gastos')->count());
        $this->command->info('   → Almacenes: ' . DB::table('almacenes')->count());
        $this->command->info('   → Zonas: ' . DB::table('zonas')->count());
        $this->command->info('   → Métodos Pago: ' . DB::table('metodos_pago')->count());
        $this->command->info('   → Banners: ' . DB::table('banners')->count());
        $this->command->info('   → Cupones: ' . DB::table('cupones')->count());
        $this->command->info('   → Reseñas: ' . DB::table('resenas')->count());
        $this->command->info('   → Proveedores: ' . DB::table('proveedor')->count());
        $this->command->info('');
        $this->command->info('   Admin:     admin@novape.com');
        $this->command->info('   Cajero:    cajero@novape.com');
        $this->command->info('   Almacén:   almacen@novape.com');
    }
}
