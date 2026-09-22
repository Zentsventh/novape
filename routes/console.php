<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Limpiar reservas de stock expiradas cada 15 minutos
Schedule::command('stock:clear-expired-reservations')->everyFifteenMinutes();

// Enviar correos de carritos abandonados (cada hora buscará carritos de 24h de antigüedad)
Schedule::command('carts:recover-abandoned')->hourly();

// Verificar stock bajo cada mañana
Schedule::command('stock:check-alerts')->dailyAt('08:00');
