<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CrmDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \Illuminate\Support\Facades\DB::table('crm_activities')->delete();
        \Illuminate\Support\Facades\DB::table('crm_deal_products')->delete();
        \Illuminate\Support\Facades\DB::table('crm_deals')->delete();
        
        $stages = \App\Models\CrmStage::all();
        if ($stages->isEmpty()) {
            $this->command->error('No hay CrmStages. Ejecuta CrmStagesSeeder primero.');
            return;
        }

        $clientes = \App\Models\Usuario::where('estado', 'activo')->get();
        if ($clientes->count() < 10) {
            $clientes = \App\Models\Usuario::factory()->count(20)->create();
        }

        $productos = \App\Models\Producto::take(10)->get();

        $estados = ['won', 'lost', 'open'];
        $nombresNegocios = [
            'Compra de Computadoras', 'Lote de Laptops HP', 'Renovación de Licencias', 
            'Equipos para Oficina', 'Servidores Dell', 'Accesorios Gamer', 
            'Monitores 4K', 'Mobiliario Ergonómico', 'Suministros Mensuales',
            'Soporte Técnico Anual', 'Instalación de Redes', 'Cámaras de Seguridad',
            'Componentes PC', 'Impresoras Multifuncionales', 'Tablets para Ventas'
        ];

        for ($i = 0; $i < 150; $i++) {
            $createdAt = now()->subDays(rand(1, 180));
            $updatedAt = (clone $createdAt)->addDays(rand(1, 15));
            if ($updatedAt > now()) $updatedAt = now();

            // Ponderar estado: 40% won, 30% lost, 30% open
            $r = rand(1, 100);
            $estado = 'open';
            if ($r <= 40) $estado = 'won';
            elseif ($r <= 70) $estado = 'lost';

            // Ponderar stage: Si es open, puede estar en cualquiera menos la ultima. Si es won/lost, asume última.
            $stage = $stages->random();
            if ($estado !== 'open') {
                $stage = $stages->last();
            }

            $deal = \App\Models\CrmDeal::create([
                'titulo' => $nombresNegocios[array_rand($nombresNegocios)] . ' - ' . $clientes->random()->nombres,
                'usuario_id' => $clientes->random()->id,
                'stage_id' => $stage->id,
                'valor' => rand(500, 15000),
                'estado' => $estado,
                'fecha_cierre_esperada' => (clone $createdAt)->addDays(30),
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);

            // Add products
            if ($productos->count() > 0) {
                $numProds = rand(1, 3);
                for ($j = 0; $j < $numProds; $j++) {
                    $prod = $productos->random();
                    $qty = rand(1, 5);
                    $precio = $prod->precio_oferta ?? $prod->precio ?? rand(50, 500);
                    $deal->products()->create([
                        'producto_id' => $prod->id,
                        'cantidad' => $qty,
                        'precio_unitario' => $precio,
                        'subtotal' => $precio * $qty
                    ]);
                }
                $deal->valor = $deal->products()->sum('subtotal');
                $deal->save();
            }
        }
        
        // Recalcular RFM para actualizar usuarios
        \Illuminate\Support\Facades\Artisan::call('crm:calculate-rfm');
    }
}
