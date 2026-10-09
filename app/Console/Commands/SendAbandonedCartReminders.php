<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Carrito;
use App\Models\Usuario;
use App\Mail\AbandonedCartReminder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;

class SendAbandonedCartReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cart:abandoned-reminder';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envía un recordatorio de correo a los usuarios que tienen carritos abandonados hace más de 24 horas.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Buscando carritos abandonados...');

        // Carritos que no se han actualizado en 24 horas
        // Y que pertenecen a usuarios registrados (usuario_id != null)
        $abandonedCarts = Carrito::where('updated_at', '<', Carbon::now()->subHours(24))
                                 ->whereNotNull('usuario_id')
                                 ->whereHas('items')
                                 ->get();

        $count = 0;

        foreach ($abandonedCarts as $cart) {
            $user = $cart->usuario;
            if ($user && $user->email && filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
                // Verificar que no se le haya enviado ya un correo en la última semana 
                // (Para esto idealmente usaríamos otra tabla, pero esto es un MVP)
                try {
                    Mail::to($user->email)->send(new AbandonedCartReminder($user));
                    $this->info("Recordatorio enviado a {$user->email}");
                    $count++;

                    // Actualizamos el updated_at para que no le llegue el mismo correo mañana
                    // hasta que vuelva a interactuar con el carrito.
                    $cart->touch(); 

                } catch (\Exception $e) {
                    $this->error("Error enviando a {$user->email}: " . $e->getMessage());
                }
            }
        }

        $this->info("Se han enviado {$count} recordatorios de carritos abandonados.");
    }
}
