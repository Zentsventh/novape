<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demo_seed_records', function (Blueprint $table) {
            $table->id();
            $table->string('batch', 80);
            $table->string('scenario', 150);
            $table->string('table_name', 100);
            $table->json('primary_key');
            $table->timestamps();
            $table->unique(['batch', 'scenario', 'table_name'], 'demo_record_scenario_unique');
        });
        foreach (['UPDATE', 'DELETE'] as $operation) {
            $name = 'inventory_journal_no_'.strtolower($operation);
            DB::unprepared('DROP TRIGGER IF EXISTS '.$name);
            if (DB::getDriverName() === 'mysql') {
                try {
                    DB::unprepared("CREATE TRIGGER $name BEFORE $operation ON inventario_movimientos FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El kardex es inmutable; registra un movimiento correctivo'");
                } catch (\Illuminate\Database\QueryException $e) {
                    if (isset($e->errorInfo[1]) && $e->errorInfo[1] == 1419) {
                        \Illuminate\Support\Facades\Log::warning("Saltando creación del trigger $name debido a restricciones de Azure/MySQL.");
                    } else {
                        throw $e;
                    }
                }
            } elseif (DB::getDriverName() === 'sqlite') {
                DB::unprepared("CREATE TRIGGER $name BEFORE $operation ON inventario_movimientos BEGIN SELECT RAISE(ABORT, 'El kardex es inmutable; registra un movimiento correctivo'); END");
            }
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('demo_seed_records');
        // Journal protections predate this migration and must survive rollback.
    }
};
