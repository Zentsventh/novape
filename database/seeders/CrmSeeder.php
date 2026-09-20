<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CrmPipeline;
use App\Models\CrmStage;
use App\Models\CrmDeal;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class CrmSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar datos previos si existen
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        CrmDeal::truncate();
        CrmStage::truncate();
        CrmPipeline::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Crear Pipeline
        $pipeline = CrmPipeline::create([
            'nombre' => 'Ventas E-commerce',
            'descripcion' => 'Pipeline general para leads y oportunidades online',
            'is_default' => true,
        ]);

        // Crear Etapas
        $stages = [
            [
                'nombre' => 'Prospecto (Lead)',
                'orden' => 1,
                'color' => '#6b7280' // Gris
            ],
            [
                'nombre' => 'Negociación / Contactado',
                'orden' => 2,
                'color' => '#f59e0b' // Ámbar
            ],
            [
                'nombre' => 'Cotización Enviada',
                'orden' => 3,
                'color' => '#3b82f6' // Azul
            ],
            [
                'nombre' => 'Cerrado Ganado',
                'orden' => 4,
                'color' => '#10b981' // Verde
            ],
            [
                'nombre' => 'Cerrado Perdido',
                'orden' => 5,
                'color' => '#ef4444' // Rojo
            ]
        ];

        $stageModels = [];
        foreach ($stages as $stageData) {
            $stageModels[] = $pipeline->stages()->create($stageData);
        }

        // Obtener usuarios existentes para crearles deals (Tomamos unos 20 si hay, sino todos)
        $usuarios = Usuario::take(30)->get();

        if ($usuarios->isEmpty()) {
            $this->command->info('No hay usuarios en la base de datos para crear deals semilla.');
            return;
        }

        // Crear datos aleatorios para que las gráficas se llenen en los últimos 6 meses
        $titles = ['Compra de lote de Ropa', 'Zapatos al por mayor', 'Renovación de stock B2B', 'Carrito recuperado de alto valor', 'Consulta por campaña'];

        foreach ($usuarios as $usuario) {
            // Cada usuario puede tener 1 o 2 deals
            $numDeals = rand(1, 2);
            
            for ($i = 0; $i < $numDeals; $i++) {
                $isWon = (rand(1, 10) <= 6); // 60% win rate aproximado
                
                if ($isWon) {
                    $stage = $stageModels[3]; // Ganado
                    $status = 'won';
                } else {
                    $isLost = (rand(1, 10) <= 3); // De los restantes, 30% perdido
                    if ($isLost) {
                        $stage = $stageModels[4]; // Perdido
                        $status = 'lost';
                    } else {
                        $stage = $stageModels[rand(0, 2)]; // En progreso (1 a 3)
                        $status = 'open';
                    }
                }

                // Distribuir en los últimos 6 meses
                $daysAgo = rand(0, 180);
                $createdAt = Carbon::now()->subDays($daysAgo);
                $updatedAt = $createdAt->copy()->addDays(rand(1, 5));

                CrmDeal::create([
                    'usuario_id' => $usuario->id,
                    'stage_id' => $stage->id,
                    'titulo' => $titles[array_rand($titles)] . ' - ' . $usuario->nombres,
                    'valor' => rand(150, 4500) + (rand(0, 99) / 100),
                    'estado' => $status,
                    'fecha_cierre_esperada' => $status === 'open' ? Carbon::now()->addDays(rand(1, 15)) : $updatedAt,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                ]);
            }
        }

        $this->command->info('Datos semilla del CRM insertados correctamente (Pipelines, Etapas y Deals ficticios).');
    }
}
