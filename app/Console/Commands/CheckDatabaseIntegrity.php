<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckDatabaseIntegrity extends Command
{
    protected $signature = 'store:integrity-check';
    protected $description = 'Conciliar saldos y registrar pendientes de calidad sin inventar históricos';
    public function handle(\App\Services\Operations\DatabaseIntegrityService $service): int
    {
        $checks = $service->scan();
        $this->table(['Control', 'Pendientes'], collect($checks)->map(fn ($count, $key) => [$key, $count])->all());
        return $checks['inventory.journal_balance'] || $checks['pos.payment_ledger'] ? self::FAILURE : self::SUCCESS;
    }
}
