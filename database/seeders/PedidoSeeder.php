<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pedido;
use App\Models\Usuario;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PedidoSeeder extends Seeder
{
    public function run(): void
    {
        // Get some users to assign orders to
        $usuarios = Usuario::where('email', '!=', 'admin@novape.com')->get();

        if ($usuarios->isEmpty()) {
            return;
        }

        $estados = ['pendiente', 'procesando', 'enviado', 'pagado', 'completado', 'cancelado'];

        // Generate 20 orders spread across the last 7 days
        for ($i = 0; $i < 20; $i++) {
            $user = $usuarios->random();
            $subtotal = rand(100, 3000) + (rand(0, 99) / 100);
            $envio = 15.00;
            $total = $subtotal + $envio;
            
            // Random date within the last 7 days
            $daysAgo = rand(0, 6);
            $createdAt = Carbon::now()->subDays($daysAgo)->setTime(rand(8, 20), rand(0, 59));

            Pedido::create([
                'usuario_id' => $user->id,
                'codigo' => 'PED-' . rand(10000000, 99999999),
                'subtotal' => $subtotal,
                'descuento' => 0.00,
                'costo_envio' => $envio,
                'total' => $total,
                'estado' => $estados[array_rand($estados)],
                'tipo_comprobante' => 'Boleta',
                'documento_cliente' => $user->dni,
                'nombre_facturacion' => $user->nombres . ' ' . $user->apellidos,
                'direccion_facturacion' => 'Direccion de prueba 123',
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }
}
