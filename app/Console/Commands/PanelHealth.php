<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Admin\Operations\PanelHealthService;
use Illuminate\Console\Command;

class PanelHealth extends Command
{
    protected $signature = 'panel:health {--json : Emitir JSON para monitorización}';
    protected $description = 'Comprobar actividad del scheduler, worker y entregas pendientes sin ejecutar operaciones';

    public function handle(PanelHealthService $health): int
    {
        try {
            $result = $health->snapshot();
        } catch (\Throwable $e) {
            $result = ['ok' => false, 'error' => 'No se pudo consultar el estado operativo. Revisar conexión de base de datos y caché.'];
            report($e);
        }
        $this->line(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $result['ok'] ? self::SUCCESS : self::FAILURE;
    }
}
