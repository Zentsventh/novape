<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/** Public product facts + supplied identities. All commercial activity is simulated. */
class RealStoreMonthSeeder extends Seeder
{
    public const BATCH = 'novape-demo-real-v1';
    private CarbonImmutable $end;
    private array $customers = [];
    private array $variants = [];
    private array $companies = [];
    private int $warehouse;
    private int $seller;

    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Estas operaciones simuladas solo se cargan en local/testing.');
        }
        $catalog = json_decode(file_get_contents(database_path('seed-data/catalogo-real.json')), true, 512, JSON_THROW_ON_ERROR);
        $identities = json_decode(file_get_contents(database_path('seed-data/clientes.json')), true, 512, JSON_THROW_ON_ERROR);
        if (count($identities) !== 200 || count(array_unique(array_column($identities, 'dni'))) !== 200) {
            throw new \RuntimeException('Se requieren 200 DNI únicos de ocho dígitos.');
        }
        foreach ($identities as $identity) {
            if (!preg_match('/^\d{8}$/', $identity['dni'])) {
                throw new \RuntimeException('DNI inválido en archivo de semillas.');
            }
        }
        $categoryCounts = array_count_values(array_column($catalog, 'category'));
        if (count($catalog) !== 130 || count($categoryCounts) !== 13) {
            throw new \RuntimeException('Se requieren 130 referencias distribuidas en 13 categorías.');
        }
        foreach ($categoryCounts as $count) {
            if ($count !== 10) throw new \RuntimeException('Cada categoría debe contener diez productos.');
        }
        foreach ($catalog as $product) {
            if ($product['currency'] !== 'PEN' || $product['price'] <= 0 || !is_file(storage_path('app/public/'.$product['image_path']))) {
                throw new \RuntimeException('Precio, moneda o imagen inválida: '.$product['name']);
            }
        }
        $this->end = CarbonImmutable::parse(env('REAL_SEED_END_DATE', '2026-10-04'), 'America/Lima')->startOfDay();
        DB::transaction(function () use ($catalog, $identities) {
            $this->setup();
            $this->customers($identities);
            $this->companies();
            $this->catalog($catalog);
            $this->month();
            $this->crm();
        });
        $this->call(StoreNavigationSeeder::class);
        foreach (['home_categorias', 'home_mejor_semana', 'home_banners', 'home_categorias_menu'] as $key) Cache::forget($key);
        $this->command?->info('200 clientes; '.count($this->variants).' productos; 90 pedidos web; 60 ventas POS; 30 días de actividad simulada.');
    }

    private function put(string $table, array $key, array $values): int
    {
        $existing = DB::table($table)->where($key)->first();
        if ($existing) {
            DB::table($table)->where('id', $existing->id)->update($values);
            return (int) $existing->id;
        }
        return (int) DB::table($table)->insertGetId(array_merge($key, $values));
    }

    private function stamps(?CarbonImmutable $date = null): array
    {
        $date ??= $this->end->subDays(29);
        return ['created_at' => $date, 'updated_at' => $date];
    }

    private function number(string $key, int $min, int $max): int
    {
        // Reproducible pseudorandom numbers keep repeated seeds consistent.
        return $min + (int) (hexdec(substr(hash('sha256', $key), 0, 7)) % ($max - $min + 1));
    }

    private function setup(): void
    {
        $adminRole = $this->put('rol', ['nombre' => 'admin'], ['descripcion' => 'Administrador', ...$this->stamps()]);
        $this->put('rol', ['nombre' => 'cliente'], ['descripcion' => 'Cliente registrado', ...$this->stamps()]);
        $permissions = ['ver_dashboard','ver_productos','crear_producto','editar_producto','eliminar_producto','ver_pedidos','editar_pedido','ver_usuarios','editar_usuario','gestionar_ajustes','gestionar_cupones','gestionar_categorias','gestionar_marcas','ver_analiticas','pos.vender','inventario.gestionar','usuarios.gestionar','reportes.ver','crm.gestionar','finanzas.gestionar','marketing.gestionar'];
        foreach ($permissions as $name) {
            $id = $this->put('permiso', ['nombre' => $name], ['descripcion' => $name, ...$this->stamps()]);
            DB::table('rol_permiso')->updateOrInsert(['rol_id' => $adminRole, 'permiso_id' => $id], []);
        }
        $admin = DB::table('usuario')->where('email', 'admin@novape.com')->first();
        if (!$admin) {
            $password = env('DEMO_SEED_PASSWORD');
            if (!is_string($password) || strlen($password) < 12) {
                throw new \RuntimeException('Configura DEMO_SEED_PASSWORD (mínimo 12 caracteres) para crear al administrador.');
            }
            $this->seller = $this->put('usuario', ['email' => 'admin@novape.com'], [
                'nombres' => 'Administrador', 'apellidos' => 'Novape', 'password_hash' => Hash::make($password),
                'has_set_password' => true, 'estado' => 'activo', 'seed_batch' => self::BATCH, ...$this->stamps(),
            ]);
        } else {
            $this->seller = (int) $admin->id;
        }
        DB::table('usuario_rol')->updateOrInsert(['usuario_id' => $this->seller, 'rol_id' => $adminRole], []);
        $this->warehouse = $this->put('almacenes', ['nombre' => 'Novape - Almacén demo'], ['direccion' => 'Av. Los Comerciantes 450, Lima (simulada)', 'activo' => true, ...$this->stamps()]);
        foreach (['almacen_ecommerce_id' => $this->warehouse, 'nombre_tienda' => 'Novape', 'moneda' => 'PEN', 'igv_porcentaje' => '18'] as $key => $value) {
            DB::table('configuracion_sitio')->updateOrInsert(['clave' => $key], ['valor' => (string) $value]);
        }
        foreach (['Efectivo' => 'fisico', 'Yape' => 'digital', 'Plin' => 'digital', 'Tarjeta' => 'digital', 'Transferencia' => 'transferencia'] as $name => $type) {
            $this->put('metodos_pago', ['nombre' => $name], ['tipo' => $type, 'activo' => true, ...$this->stamps()]);
        }
        $this->put('zonas', ['nombre' => 'Lima demo'], ['costo_envio' => 15, 'activo' => true, ...$this->stamps()]);
    }

    private function customers(array $identities): void
    {
        $role = DB::table('rol')->where('nombre', 'cliente')->value('id');
        $streets = ['Los Olivos', 'Las Palmeras', 'Los Cedros', 'Los Pinos', 'Los Laureles'];
        foreach ($identities as $index => $person) {
            $first = Str::ascii(explode(' ', $person['nombres'])[0]);
            $last = Str::ascii(explode(' ', $person['apellidos'])[0]);
            $email = strtolower($first.'.'.$last.$this->number($person['dni'].'email', 100, 999)).'@example.test';
            $address = 'Jr. '.$streets[$index % count($streets)].' '.$this->number($person['dni'].'addr', 100, 999);
            $phone = '9'.$this->number($person['dni'].'phone', 10000000, 99999999);
            $existing = DB::table('usuario')->where('dni', $person['dni'])->first();
            if ($existing && $existing->seed_batch !== self::BATCH) {
                $id = (int) $existing->id;
            } else {
                $values = [...$person, 'email' => $email, 'telefono' => $phone, 'tipo_documento' => 'DNI', 'estado' => 'activo',
                    'seed_batch' => self::BATCH, 'custom_fields' => json_encode(['datos_contacto_simulados' => true]), ...$this->stamps()];
                if (!$existing) $values['password_hash'] = Hash::make(Str::random(48));
                $id = $this->put('usuario', ['dni' => $person['dni']], $values);
                $this->put('direccion_usuario', ['usuario_id' => $id, 'referencia' => 'Dirección simulada - '.self::BATCH], [
                    'direccion' => $address, 'departamento' => 'Lima', 'provincia' => 'Lima', 'distrito' => 'Los Olivos', 'principal' => true, ...$this->stamps(),
                ]);
                DB::table('usuario_rol')->updateOrInsert(['usuario_id' => $id, 'rol_id' => $role], []);
            }
            $client = DB::table('clientes')->where('numero_documento', $person['dni'])->first();
            $clientId = $client && $client->seed_batch !== self::BATCH ? (int) $client->id : $this->put('clientes', ['numero_documento' => $person['dni']], [
                'tipo_documento' => 'DNI', 'nombre_razon_social' => $person['nombres'].' '.$person['apellidos'],
                'direccion' => $address.' (simulada)', 'telefono' => $phone, 'correo' => $email, 'seed_batch' => self::BATCH, ...$this->stamps(),
            ]);
            $this->customers[] = ['id' => $id, 'client_id' => $clientId, 'dni' => $person['dni'], 'name' => $person['nombres'].' '.$person['apellidos'], 'address' => $address];
        }
    }

    private function companies(): void
    {
        $companies = [
            ['ruc' => '20141189850', 'nombre' => 'CONECTA RETAIL S.A.', 'url' => 'https://www.efe.com.pe/terminos-y-condiciones'],
            ['ruc' => '20100047218', 'nombre' => 'BANCO DE CREDITO DEL PERU S.A.', 'url' => 'https://www.viabcp.com/'],
            ['ruc' => '20100053455', 'nombre' => 'BANCO INTERNACIONAL DEL PERU S.A.A.', 'url' => 'https://interbank.pe/avisos-legales'],
        ];
        foreach ($companies as $company) {
            $id = $this->put('crm_companies', ['ruc' => $company['ruc']], [
                'nombre' => $company['nombre'], 'sitio_web' => $company['url'], 'pais' => 'Perú',
                'descripcion' => 'Identidad pública verificada; las relaciones y operaciones de esta semilla son simuladas.',
                'seed_batch' => self::BATCH, ...$this->stamps(),
            ]);
            $clientId = $this->put('clientes', ['numero_documento' => $company['ruc']], [
                'tipo_documento' => 'RUC', 'nombre_razon_social' => $company['nombre'], 'direccion' => 'Av. Comercial 500, Lima (simulada)',
                'seed_batch' => self::BATCH, ...$this->stamps(),
            ]);
            $this->companies[] = [...$company, 'id' => $id, 'client_id' => $clientId];
        }
    }

    private function catalog(array $catalog): void
    {
        foreach ($catalog as $record) {
            $sku = 'REAL-'.strtoupper(substr(hash('sha256', $record['source_url']), 0, 16));
            $brand = $this->put('marca', ['nombre' => $record['brand']], $this->stamps());
            $category = $this->put('categoria', ['slug' => Str::slug($record['category'])], ['nombre' => $record['category'], 'activa' => true, 'categoria_padre_id' => null, ...$this->stamps()]);
            $product = $this->put('producto', ['sku_base' => $sku], [
                'nombre' => $record['name'], 'slug' => Str::slug($record['name']).'-'.strtolower(substr($sku, -6)),
                'marca_id' => $brand, 'descripcion' => $record['description'], 'garantias' => $record['warranty'],
                'fuente_url' => $record['source_url'], 'fuente_consultada_at' => $record['collected_on'],
                'activo' => true, 'retiro_tienda' => true, 'envio_domicilio' => true, 'deleted_at' => null, ...$this->stamps(),
            ]);
            DB::table('producto_categoria')->updateOrInsert(['producto_id' => $product, 'categoria_id' => $category], []);
            $stock = $this->number($sku, 100, 200);
            $cost = round($record['price'] * 0.72, 2); // Simulated acquisition cost, not a supplier quote.
            $variant = $this->put('variante', ['sku' => $sku], [
                'producto_id' => $product, 'precio' => $record['price'], 'precio_anterior' => $record['previous_price'], 'precio_compra' => $cost,
                'stock' => $stock, 'stock_reservado' => 0, 'stock_minimo' => 10, 'stock_maximo' => 200, 'stock_seguridad' => 15,
                'atributos' => json_encode(['modelo' => $record['model']], JSON_UNESCAPED_UNICODE), 'activo' => true, 'deleted_at' => null, ...$this->stamps(),
            ]);
            $this->put('stock_almacen', ['almacen_id' => $this->warehouse, 'variante_id' => $variant], ['cantidad' => $stock, ...$this->stamps()]);
            $this->put('producto_imagen', ['producto_id' => $product, 'orden' => 0], ['url' => '/storage/'.$record['image_path'], ...$this->stamps()]);
            foreach ($record['specifications'] as $key => $value) {
                $this->put('producto_especificaciones', ['producto_id' => $product, 'clave' => $key], ['valor' => $value, ...$this->stamps()]);
            }
            $this->put('historial_precio', ['variante_id' => $variant, 'fecha_inicio' => $this->end->subDays(29)], ['precio' => $record['price'], ...$this->stamps()]);
            $this->variants[$variant] = ['id' => $variant, 'product_id' => $product, 'name' => $record['name'], 'price' => $record['price'], 'cost' => $cost, 'stock' => $stock];
        }
        $this->variants = array_values($this->variants);
    }

    private function month(): void
    {
        $methods = DB::table('metodos_pago')->where('activo', true)->pluck('id')->all();
        $sold = [];
        $states = ['completado','completado','completado','completado','completado','pagado','enviado','pendiente','cancelado','completado'];
        for ($day = 0; $day < 30; $day++) {
            $date = $this->end->subDays(29 - $day)->setTime(10, 0);
            for ($ticket = 0; $ticket < 5; $ticket++) {
                $sequence = $day * 5 + $ticket;
                $customer = $this->customers[$this->number('customer'.$sequence, 0, 199)];
                $company = $sequence % 10 === 0 ? $this->companies[$sequence % 3] : null;
                // Small shop: 5 transactions/day, 1-2 distinct items, mostly one unit.
                $lines = [];
                for ($line = 0; $line < $this->number('lines'.$sequence, 1, 2); $line++) {
                    $v = $this->variants[($sequence * 7 + $line * 19) % count($this->variants)];
                    $quantity = $this->number('qty'.$sequence.$line, 1, 10) === 1 ? 2 : 1;
                    $lines[] = [...$v, 'quantity' => $quantity];
                }
                $subtotal = round(array_sum(array_map(fn ($l) => $l['price'] * $l['quantity'], $lines)), 2);
                $method = $methods[$sequence % count($methods)];
                $dateTicket = $date->addHours($ticket)->addMinutes($this->number('time'.$sequence, 0, 45));
                if ($ticket < 3) {
                    $state = $states[($day * 3 + $ticket) % count($states)];
                    $shipping = $subtotal >= 500 ? 0 : 15;
                    $total = $subtotal + $shipping;
                    $order = $this->put('pedido', ['codigo' => sprintf('DEMO-WEB-%03d', $sequence + 1)], [
                        'usuario_id' => $customer['id'], 'subtotal' => $subtotal, 'descuento' => 0, 'costo_envio' => $shipping, 'total' => $total,
                        'estado' => $state, 'tipo_comprobante' => $company ? 'Factura' : 'Boleta',
                        'documento_cliente' => $company['ruc'] ?? $customer['dni'], 'nombre_facturacion' => $company['nombre'] ?? $customer['name'],
                        'direccion_facturacion' => $customer['address'].' (simulada)', 'facturado_sunat' => false,
                        'direccion_envio_snapshot' => json_encode(['direccion' => $customer['address'], 'distrito' => 'Los Olivos', 'provincia' => 'Lima', 'departamento' => 'Lima', 'simulado' => true]),
                        'tracking_number' => in_array($state, ['enviado','completado']) ? 'DEMO-TRACK-'.($sequence + 1) : null,
                        'courier_name' => 'Reparto simulado', 'seed_batch' => self::BATCH, ...$this->stamps($dateTicket),
                    ]);
                    DB::table('pedido_item')->where('pedido_id', $order)->delete();
                    foreach ($lines as $l) {
                        DB::table('pedido_item')->insert(['pedido_id' => $order, 'variante_id' => $l['id'], 'cantidad' => $l['quantity'], 'precio_unitario' => $l['price'], ...$this->stamps($dateTicket)]);
                    }
                    $paid = in_array($state, ['completado','enviado','pagado']);
                    $this->put('pago', ['pedido_id' => $order], ['metodo' => DB::table('metodos_pago')->where('id', $method)->value('nombre'), 'estado' => $paid ? 'completado' : ($state === 'cancelado' ? 'cancelado' : 'pendiente'), 'monto' => $total, ...$this->stamps($dateTicket)]);
                    $this->put('envio', ['pedido_id' => $order], ['estado' => $state === 'completado' ? 'entregado' : ($state === 'enviado' ? 'enviado' : ($state === 'cancelado' ? 'cancelado' : 'preparando')), 'tracking' => 'DEMO-TRACK-'.($sequence + 1), ...$this->stamps($dateTicket)]);
                    if ($paid) {
                        $base = round($total / 1.18, 2);
                        $this->put('comprobantes', ['codigo_ticket' => 'DEMO-COMP-'.($sequence + 1)], ['pedido_id' => $order, 'tipo' => $company ? 'factura' : 'boleta', 'serie' => $company ? 'DF01' : 'DB01', 'numero' => (string) ($sequence + 1), 'estado_sunat' => 'simulado', 'total' => $total, 'operaciones_gravadas' => $base, 'igv' => round($total - $base, 2), 'cliente_nombre' => $company['nombre'] ?? $customer['name'], 'cliente_documento' => $company['ruc'] ?? $customer['dni'], 'cliente_tipo_documento' => $company ? 'RUC' : 'DNI', 'emitido_at' => $dateTicket, ...$this->stamps($dateTicket)]);
                    }
                } else {
                    $paid = true;
                    $sale = $this->put('ventas_pos', ['codigo_ticket' => sprintf('DEMO-POS-%03d', $sequence + 1)], [
                        'cliente_id' => $company['client_id'] ?? $customer['client_id'], 'cajero_id' => $this->seller, 'metodo_pago_id' => $method,
                        'subtotal' => round($subtotal / 1.18, 2), 'igv' => round($subtotal - $subtotal / 1.18, 2), 'total' => $subtotal,
                        'tipo_comprobante' => $company ? 'factura' : 'boleta', 'seed_batch' => self::BATCH, ...$this->stamps($dateTicket),
                    ]);
                    DB::table('venta_pos_items')->where('venta_pos_id', $sale)->delete();
                    foreach ($lines as $l) {
                        DB::table('venta_pos_items')->insert(['venta_pos_id' => $sale, 'variante_id' => $l['id'], 'producto_nombre' => $l['name'], 'cantidad' => $l['quantity'], 'precio_unitario' => $l['price'], 'subtotal' => round($l['price'] * $l['quantity'], 2), ...$this->stamps($dateTicket)]);
                    }
                    $this->put('venta_pos_pagos', ['venta_pos_id' => $sale, 'metodo_pago_id' => $method], ['monto' => $subtotal, ...$this->stamps($dateTicket)]);
                }
                if ($paid) foreach ($lines as $l) {
                    $sold[$l['id']] = ($sold[$l['id']] ?? 0) + $l['quantity'];
                    $this->put('movimientos_almacen', ['referencia' => 'DEMO-SALIDA-'.$sequence.'-'.$l['id']], ['almacen_id' => $this->warehouse, 'variante_id' => $l['id'], 'tipo' => 'salida', 'cantidad' => $l['quantity'], 'usuario_id' => $this->seller, ...$this->stamps($dateTicket)]);
                }
            }
        }
        $this->inventory($sold);
        foreach ([['Alquiler', 1800, 'fijo'], ['Personal', 3200, 'fijo'], ['Servicios', 350, 'variable'], ['Publicidad', 450, 'variable'], ['Reparto', 650, 'variable']] as $index => [$name, $amount, $type]) {
            $date = $this->end->subDays(25 - $index * 5);
            $this->put('gastos', ['concepto' => 'DEMO - '.$name, 'seed_batch' => self::BATCH], ['monto' => $amount, 'categoria' => 'operativo', 'tipo' => $type, 'fecha_gasto' => $date->toDateString(), ...$this->stamps($date)]);
        }
        foreach ($this->customers as $customer) {
            $query = DB::table('pedido')->where('usuario_id', $customer['id'])->whereIn('estado', ['completado','enviado','pagado']);
            if (DB::table('usuario')->where('id', $customer['id'])->value('seed_batch') === self::BATCH) {
                DB::table('usuario')->where('id', $customer['id'])->update(['total_orders' => $query->count(), 'ltv' => $query->sum('total'), 'last_order_date' => $query->max('created_at'), 'segmento' => $query->count() > 1 ? 'frecuente' : 'nuevo']);
            }
        }
    }

    private function inventory(array $sold): void
    {
        $provider = $this->put('proveedor', ['nombre' => 'Proveedor de demostración Novape'], ['activo' => true, 'contacto' => 'Datos simulados', ...$this->stamps()]);
        $purchase = $this->put('compras', ['numero_orden' => 'DEMO-OC-001'], ['proveedor_id' => $provider, 'total' => 0, 'estado' => 'completado', 'notas' => 'Reposición simulada del mes; costos estimados al 72% del precio de venta.', 'fecha_compra' => $this->end->subDays(29)->toDateString(), 'seed_batch' => self::BATCH, ...$this->stamps()]);
        DB::table('compra_items')->where('compra_id', $purchase)->delete();
        $purchaseTotal = 0;
        foreach ($this->variants as $v) {
            $qty = $sold[$v['id']] ?? 0;
            // Opening inventory + monthly purchases - sales = requested closing stock.
            $this->put('movimientos_almacen', ['referencia' => 'DEMO-APERTURA-'.$v['id']], ['almacen_id' => $this->warehouse, 'variante_id' => $v['id'], 'tipo' => 'entrada', 'cantidad' => $v['stock'], 'usuario_id' => $this->seller, ...$this->stamps($this->end->subDays(30))]);
            if ($qty > 0) {
                $subtotal = round($qty * $v['cost'], 2);
                $purchaseTotal += $subtotal;
                DB::table('compra_items')->insert(['compra_id' => $purchase, 'producto_id' => $v['product_id'], 'variante_id' => $v['id'], 'cantidad' => $qty, 'costo_unitario' => $v['cost'], 'subtotal' => $subtotal, ...$this->stamps()]);
                $this->put('movimientos_almacen', ['referencia' => 'DEMO-COMPRA-'.$v['id']], ['almacen_id' => $this->warehouse, 'variante_id' => $v['id'], 'tipo' => 'entrada', 'cantidad' => $qty, 'usuario_id' => $this->seller, ...$this->stamps()]);
            }
        }
        DB::table('compras')->where('id', $purchase)->update(['total' => round($purchaseTotal, 2)]);
    }

    private function crm(): void
    {
        $pipeline = $this->put('crm_pipelines', ['nombre' => 'Ventas demo Novape'], ['descripcion' => 'Embudo de ventas simulado', 'is_default' => true, ...$this->stamps()]);
        $stages = [];
        foreach (['Nuevo','Contactado','Cotización','Negociación','Ganado','Perdido'] as $index => $name) {
            $stages[] = $this->put('crm_stages', ['pipeline_id' => $pipeline, 'nombre' => $name], ['orden' => $index + 1, 'color' => ['#64748b','#3b82f6','#8b5cf6','#f59e0b','#22c55e','#ef4444'][$index], ...$this->stamps()]);
        }
        for ($index = 0; $index < 30; $index++) {
            $stage = $index % 6;
            $date = $this->end->subDays(29 - $index);
            $v = $this->variants[$index % count($this->variants)];
            $deal = $this->put('crm_deals', ['titulo' => sprintf('DEMO - Oportunidad %02d', $index + 1)], ['usuario_id' => $this->customers[$index]['id'], 'stage_id' => $stages[$stage], 'valor' => $v['price'], 'estado' => $stage === 4 ? 'won' : ($stage === 5 ? 'lost' : 'open'), 'fecha_cierre_esperada' => $date->addDays(7), 'custom_fields' => json_encode(['simulado' => true]), ...$this->stamps($date), 'updated_at' => $date->addDays(min(3, 29 - $index))]);
            $this->put('crm_activities', ['deal_id' => $deal, 'tipo' => 'tarea'], ['usuario_id' => $this->seller, 'contenido' => 'DEMO - Seguimiento de cotización (simulado)', 'completada' => $stage >= 4, 'fecha_vencimiento' => $date->addDays(2), ...$this->stamps($date)]);
            $this->put('crm_deal_products', ['crm_deal_id' => $deal, 'producto_id' => $v['product_id']], ['cantidad' => 1, 'precio_unitario' => $v['price'], 'subtotal' => $v['price'], ...$this->stamps($date)]);
        }
        for ($index = 0; $index < 8; $index++) {
            $this->put('crm_cases', ['titulo' => 'DEMO - Consulta posventa '.($index + 1)], ['descripcion' => 'Caso de prueba simulado para revisar el panel de atención.', 'cliente_id' => $this->customers[$index]['id'], 'asignado_a' => $this->seller, 'tipo' => 'consulta', 'estado' => ['abierto','en_progreso','resuelto','cerrado'][$index % 4], 'prioridad' => ['baja','media','alta','urgente'][$index % 4], 'fecha_vencimiento' => $this->end->addDays(3), ...$this->stamps($this->end->subDays($index))]);
        }
    }
}
