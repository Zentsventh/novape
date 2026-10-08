<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cupon;
use App\Models\MarketingCampaign;
use App\Models\Gasto;
use App\Models\Proveedor;
use App\Models\CrmCustomFieldSchema;
use App\Models\Reclamo;
use App\Models\Devolucion;
use App\Models\RmaRequest;
use App\Models\Resena;
use App\Models\CrmCompany;
use App\Models\StaffThread;
use App\Models\Promocion;
use App\Models\Carrito;
use App\Models\CarritoItem;
use App\Models\SalesAppointment;
use App\Models\Almacen;
use App\Models\InventarioMovimiento;
use App\Models\Usuario;
use App\Models\Producto;
use App\Models\Variante;
use App\Models\Pedido;

class EverythingSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Sembrando datos en todo el panel (Modelos Eloquent)...');

        // 1. Cupones
        Cupon::firstOrCreate(['codigo' => 'BIENVENIDA20'], ['tipo' => 'porcentaje', 'valor' => 20, 'fecha_fin' => now()->addMonths(6), 'activo' => true]);
        Cupon::firstOrCreate(['codigo' => 'DESCUENTO50'], ['tipo' => 'fijo', 'valor' => 50, 'fecha_fin' => now()->addMonths(1), 'activo' => true]);

        // 2. Marketing
        MarketingCampaign::firstOrCreate(['nombre' => 'Campaña de Verano'], ['descripcion' => 'Descuentos electro', 'estado' => 'active', 'fecha_inicio' => now(), 'fecha_fin' => now()->addMonths(2)]);
        
        // 3. Gastos
        Gasto::firstOrCreate(['descripcion' => 'Pago de Luz'], ['monto' => 350.50, 'fecha' => now()->subDays(2), 'categoria' => 'Servicios']);

        // 4. Proveedores
        Proveedor::firstOrCreate(['ruc' => '20100022233'], ['razon_social' => 'Samsung Electronics Perú', 'email' => 'ventas@samsung.com.pe']);

        // 5. CRM Custom Fields
        CrmCustomFieldSchema::firstOrCreate(['model_type' => 'company', 'field_name' => 'Industria'], ['field_type' => 'string']);
        CrmCustomFieldSchema::firstOrCreate(['model_type' => 'company', 'field_name' => 'Tamaño de Empresa'], ['field_type' => 'number']);
        CrmCustomFieldSchema::firstOrCreate(['model_type' => 'deal', 'field_name' => 'Competidor'], ['field_type' => 'string']);

        // 6. Reclamos
        Reclamo::firstOrCreate(['codigo' => 'REC-2023-001'], ['nombres' => 'Juan', 'apellidos' => 'Perez', 'email' => 'juan@gmail.com', 'telefono' => '999888777', 'tipo_documento' => 'DNI', 'numero_documento' => '12345678', 'motivo' => 'retraso_entrega', 'detalle' => 'No llegó mi pedido', 'estado' => 'abierto']);

        $usuario = Usuario::where('email', '!=', 'admin@novape.com')->first();
        if (!$usuario) {
            $usuario = Usuario::create([
                'nombres' => 'Cliente', 'apellidos' => 'Prueba', 'email' => 'cliente2@prueba.com', 'password_hash' => bcrypt('password'), 'estado' => 'activo'
            ]);
        }
        $pedido = Pedido::first();

        // 7. Devoluciones / RMA
        if ($pedido) {
            Devolucion::firstOrCreate(['pedido_id' => $pedido->id], ['motivo' => 'No me gusta', 'estado' => 'pendiente']);
            RmaRequest::firstOrCreate(['codigo' => 'RMA-001'], ['usuario_id' => $usuario->id, 'pedido_id' => $pedido->id, 'motivo' => 'Falla', 'estado' => 'pendiente']);
        }

        $producto = Producto::first();
        if ($producto) {
            Resena::firstOrCreate(['producto_id' => $producto->id, 'usuario_id' => $usuario->id], ['calificacion' => 5, 'comentario' => 'Excelente producto', 'aprobado' => true]);
        }

        // 9. Crm Companies
        CrmCompany::firstOrCreate(['ruc' => '20123456789'], ['nombre' => 'Tech Solutions EIRL', 'email' => 'contacto@techsolutions.pe']);

        // 10. Staff Threads
        StaffThread::firstOrCreate(['subject' => 'Consulta sobre lote'], ['created_by' => 1, 'status' => 'open']);

        // 11. Promociones
        Promocion::firstOrCreate(['nombre' => 'Cyber Days 2026'], ['tipo_descuento' => 'porcentaje', 'valor_descuento' => 15, 'fecha_inicio' => now(), 'fecha_fin' => now()->addDays(5), 'activa' => true]);

        // 12. Carrito
        $variante = Variante::first();
        if ($variante) {
            $carrito = Carrito::create(['usuario_id' => $usuario->id, 'total' => $variante->precio]);
            $carrito->updated_at = now()->subHours(5); // Abandoned
            $carrito->save();
            CarritoItem::create(['carrito_id' => $carrito->id, 'variante_id' => $variante->id, 'cantidad' => 1, 'precio' => $variante->precio]);
        }

        // 13. Appointments
        SalesAppointment::firstOrCreate(['title' => 'Llamada inicial'], ['usuario_id' => $usuario->id, 'agent_id' => 1, 'start_time' => now()->addDays(1)->setHour(10)->setMinute(0), 'end_time' => now()->addDays(1)->setHour(11)->setMinute(0), 'status' => 'scheduled']);

        // 14. Almacen & Inventario
        $almacen = Almacen::firstOrCreate(['nombre' => 'Almacén Central'], ['ubicacion' => 'Ate, Lima', 'capacidad_total' => 10000, 'activo' => true]);
        
        if ($almacen && $variante) {
            InventarioMovimiento::firstOrCreate(['variante_id' => $variante->id, 'almacen_id' => $almacen->id, 'tipo' => 'ingreso'], ['cantidad' => 50, 'motivo' => 'Compra', 'usuario_id' => 1]);
        }

        $this->command->info('Base de datos completamente sembrada con datos de demostración en todos los módulos.');
    }
}
