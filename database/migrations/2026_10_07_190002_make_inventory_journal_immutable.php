<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['UPDATE', 'DELETE'] as $operation) {
            $name = 'inventory_journal_no_'.strtolower($operation);
            if (DB::getDriverName() === 'mysql') {
                try {
                    DB::unprepared("CREATE TRIGGER $name BEFORE $operation ON inventario_movimientos FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El kardex es inmutable; registra un movimiento correctivo'");
                } catch (\Illuminate\Database\QueryException $e) {
                    if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1419) {
                        \Illuminate\Support\Facades\Log::warning("Saltando creación del trigger $name debido a restricciones de Azure/MySQL (log_bin_trust_function_creators).");
                    } else {
                        throw $e;
                    }
                }
            } else {
                DB::unprepared("CREATE TRIGGER $name BEFORE $operation ON inventario_movimientos BEGIN SELECT RAISE(ABORT, 'El kardex es inmutable; registra un movimiento correctivo'); END");
            }
        }
    }
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS inventory_journal_no_update');
        DB::unprepared('DROP TRIGGER IF EXISTS inventory_journal_no_delete');
    }
};
