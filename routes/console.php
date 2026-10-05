<?php

use App\Jobs\DeliverOrderNotificationJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(fn () => \Illuminate\Support\Facades\Cache::put('panel:scheduler', now()->timestamp, 600))
    ->name('panel-scheduler-heartbeat')->everyMinute();

// Limpiar reservas de stock expiradas cada 15 minutos
Schedule::command('app:clear-expired-reservations')->everyFifteenMinutes();

// Enviar correos de carritos abandonados (cada hora buscará carritos de 24h de antigüedad)
Schedule::command('carts:recover-abandoned')->hourly();

// Verificar stock bajo cada mañana
Schedule::command('stock:check-alerts')->dailyAt('08:00');

Schedule::call(function () {
    DB::table('order_notification_outbox')->where('status', 'pending')->orderBy('id')->limit(200)->get()
        ->each(fn ($row) => DeliverOrderNotificationJob::dispatch($row->id));
})->name('recover-order-notifications')->everyMinute()->withoutOverlapping();
