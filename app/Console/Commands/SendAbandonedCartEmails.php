<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendAbandonedCartEmails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cart:abandoned-notify';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envía un correo de recuperación a usuarios con carritos abandonados (más de 12 hrs sin actividad)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Usuarios con carrito no vacío, cuya última actualización (actividad de cuenta/carrito) fue hace más de 12 horas
        // y menos de 24 horas (para evitar enviarles spam todos los días)
        $usuarios = \App\Models\Usuario::whereNotNull('carrito_json')
            ->where('carrito_json', '!=', '[]')
            ->where('updated_at', '<', now()->subHours(12))
            ->where('updated_at', '>=', now()->subHours(24))
            ->get();

        $count = 0;
        foreach ($usuarios as $usuario) {
            $cartItems = $usuario->carrito_json;
            if (is_array($cartItems) && count($cartItems) > 0) {
                try {
                    \Illuminate\Support\Facades\Mail::to($usuario->email)->send(new \App\Mail\AbandonedCartMail($usuario, $cartItems));
                    $this->info("Correo de abandono enviado a: {$usuario->email}");
                    $count++;

                    // CRM Sync: Si el carrito tiene más de 500 en valor, crear un Deal (Lead)
                    $montoCarrito = array_reduce($cartItems, function ($carry, $item) {
                        return $carry + ($item['precio'] * $item['cantidad']);
                    }, 0);

                    if ($montoCarrito >= 500) {
                        $pipeline = \App\Models\CrmPipeline::with('stages')->first();
                        $stageId = $pipeline && $pipeline->stages->count() > 0 ? $pipeline->stages->first()->id : 1;
                        
                        $deal = \App\Models\CrmDeal::firstOrCreate(
                            [
                                'usuario_id' => $usuario->id,
                                'titulo' => 'Recuperar Carrito: ' . $usuario->nombres,
                                'estado' => 'open'
                            ],
                            [
                                'stage_id' => $stageId,
                                'valor' => $montoCarrito
                            ]
                        );

                        if ($deal->wasRecentlyCreated) {
                            \App\Models\CrmActivity::create([
                                'deal_id' => $deal->id,
                                'tipo' => 'system',
                                'titulo' => 'Carrito de alto valor abandonado',
                                'descripcion' => 'El sistema detectó un carrito superior a S/ 500 abandonado. Se sugiere contactar por WhatsApp.',
                            ]);
                        }
                    }

                } catch (\Exception $e) {
                    $this->error("Error al enviar a {$usuario->email}: " . $e->getMessage());
                }
            }
        }

        $this->info("Finalizado. Se enviaron $count correos de recuperación de carrito.");
    }
}
