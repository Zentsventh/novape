<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Carrito;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\AbandonedCartMail;
use Illuminate\Support\Facades\Log;

class RecoverAbandonedCarts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'carts:recover-abandoned';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Encuentra carritos abandonados por más de 24 horas y envía un correo de recuperación.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = 0;
        Carrito::whereNotNull('usuario_id')->whereNull('notified_at')
            ->where('updated_at', '<', now()->subHours(24))->where('updated_at', '>', now()->subHours(72))
            ->whereHas('items')->with('usuario')->chunkById(100, function ($carts) use (&$count) {
                foreach ($carts as $cart) {
                    if (! $cart->usuario || ! \App\Services\Marketing\MarketingConsent::allows($cart->usuario)) continue;
                    \App\Services\Orders\StorefrontTaskService::record('cart:'.$cart->id.':'.$cart->updated_at->timestamp,
                        'cart_recovery', null, $cart->usuario->email, ['cart_id' => $cart->id, 'activity' => $cart->updated_at->timestamp]);
                    $count++;
                }
            });
        $this->info('Recordatorios registrados: '.$count);
        return self::SUCCESS;
    }
}
