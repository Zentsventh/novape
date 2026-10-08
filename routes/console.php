<?php

use App\Jobs\DeliverOrderNotificationJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    /** @var \Illuminate\Foundation\Console\ClosureCommand $this */
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
Schedule::command('store:integrity-check')->dailyAt('07:00')->withoutOverlapping();
Schedule::command('store:database-backup')->dailyAt('01:00')->withoutOverlapping();
Schedule::command('store:database-backup --verify')->weeklyOn(0, '02:00')->withoutOverlapping();
Schedule::command('store:prune-operational')->dailyAt('03:00')->withoutOverlapping();
Schedule::command('store:archive-binlogs')->everyFifteenMinutes()->withoutOverlapping();
Schedule::command('store:review-payment-attempts')->everyMinute()->withoutOverlapping();
Schedule::command('crm:calculate-rfm')->hourly()->withoutOverlapping();
Schedule::command('team:maintenance')->everyMinute()->withoutOverlapping();
Schedule::call(fn () => \App\Services\Orders\StorefrontTaskService::recover())
    ->name('recover-storefront-tasks')->everyMinute()->withoutOverlapping();

Schedule::call(function () {
    DB::table('order_notification_outbox')->where('status', 'pending')->orderBy('id')->limit(200)->get()
        ->each(fn ($row) => DeliverOrderNotificationJob::dispatch($row->id)->onConnection(config('storefront.queue_connection'))->onQueue('storefront'));
    DB::table('order_notification_outbox')->where('status', 'sending')->where('updated_at', '<', now()->subMinutes(10))
        ->update(['status' => 'failed', 'error' => 'Proceso interrumpido: verifica la entrega antes de reintentar.', 'updated_at' => now()]);
})->name('recover-order-notifications')->everyMinute()->withoutOverlapping();
