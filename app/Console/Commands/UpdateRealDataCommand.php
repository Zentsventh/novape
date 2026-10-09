<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Almacen;

class UpdateRealDataCommand extends Command
{
    protected $signature = 'data:real';
    protected $description = 'Updates the system with realistic business and commercial data for an appliance store in Peru.';

    public function handle()
    {
        $this->info('Starting 360 realistic data injection...');

        $configs = [
            'business_identity' => 'Novape Electrodomésticos S.A.C. | RUC: 20601234567 | Av. José Carlos Mariátegui, Lote 60 Zona A, Ate, Lima, Perú',
            'email_contacto' => 'contacto@novape.pe',
            'telefono_contacto' => '(01) 555-0123 / +51 987654321',
            'return_policy' => "Ofrecemos 7 días calendario para cambios y devoluciones por fallas de fábrica certificadas por la marca. El electrodoméstico no debe presentar daños por mal uso y debe ser devuelto con todos sus manuales, empaques y accesorios originales intactos. Posterior a este plazo, aplica la Garantía Oficial del Fabricante (generalmente de 1 a 10 años dependiendo del motor/compresor).",
            'delivery_eta' => "Lima Metropolitana: Entrega Regular de 2 a 4 días hábiles. Provincias (Nivel Nacional): De 5 a 10 días hábiles dependiendo de la agencia de transporte y el volumen del equipo. Los envíos de gran volumen incluyen seguro de carga.",
            'pickup_enabled' => '1',
            'pickup_hours' => 'Lunes a Sábado de 09:00 a 18:00 hrs. (No hay atención domingos ni feriados)',
            'almacen_ecommerce_id' => '2'
        ];

        foreach ($configs as $key => $val) {
            DB::table('configuracion_sitio')->updateOrInsert(['clave' => $key], ['valor' => $val]);
        }
        $this->info('Commercial policies updated.');

        // 2. Realistic Warehouse/Pickup Location
        $almacen = Almacen::find(2);
        if ($almacen) {
            $almacen->nombre = 'Tienda Principal Novape - Ate';
            $almacen->direccion = 'Av. José Carlos Mariátegui, Lote 60 Zona A, Ate, Lima, Perú';
            $almacen->save();
            $this->info('Pickup location (Almacén Central) updated successfully.');
        } else {
            // Fallback to update any first warehouse if ID 2 is somehow not what we expect
            $first = Almacen::first();
            if ($first) {
                $first->nombre = 'Tienda Principal Novape - Ate';
                $first->direccion = 'Av. José Carlos Mariátegui, Lote 60 Zona A, Ate, Lima, Perú';
                $first->save();
                DB::table('configuracion_sitio')->updateOrInsert(['clave' => 'almacen_ecommerce_id'], ['valor' => (string) $first->id]);
                $this->info('Fallback: Updated first available warehouse as Central.');
            }
        }

        $this->info('Realistic data injection completed.');
    }
}
