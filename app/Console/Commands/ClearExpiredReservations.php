<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ClearExpiredReservations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clear-expired-reservations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Libera el stock de las reservas de productos en carritos que han expirado.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiredReservations = \App\Models\ReservaStock::where('expires_at', '<=', now())->get();
        
        $count = $expiredReservations->count();
        if ($count > 0) {
            \App\Models\ReservaStock::where('expires_at', '<=', now())->delete();
            $this->info("Se han liberado $count reservas de stock expiradas.");
            \Illuminate\Support\Facades\Log::info("Cron: Se liberaron $count reservas de stock expiradas.");
        } else {
            $this->info('No hay reservas expiradas para limpiar.');
        }
    }
}
