<?php

namespace App\Console\Commands;
use App\Services\Operations\DatabaseRepairService;
use Illuminate\Console\Command;

class ReconcileRecordedInventory extends Command
{
    protected $signature = 'store:reconcile-recorded-stock {--apply : Registrar correcciones trazables y recalcular el stock derivado}';
    protected $description = 'Conciliar el kardex con el saldo registrado; no sustituye un conteo físico';
    public function handle(DatabaseRepairService $service): int
    {
        if (!$this->option('apply')) {
            $this->info('Usa --apply después de verificar un respaldo. Conserva los saldos de almacén y añade movimientos explícitos de conciliación.');
            return self::SUCCESS;
        }
        $this->info(json_encode($service->reconcileRecordedStock(), JSON_THROW_ON_ERROR));
        return self::SUCCESS;
    }
}
