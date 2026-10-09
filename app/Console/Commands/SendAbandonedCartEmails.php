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
    public function handle(): int
    {
        return $this->call('carts:recover-abandoned');
    }
}
