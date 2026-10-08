<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cascading SET NULL on columns used by generated unique keys is rejected
        // by newer MariaDB. Cash sessions must preserve cashier/register identity.
        foreach (['cajero_id' => 'usuario', 'caja_id' => 'cajas'] as $column => $parent) {
            $fk = collect(Schema::getForeignKeys('cajas_sesiones'))->first(fn ($fk) => in_array($column, $fk['columns'], true));
            if ($fk) Schema::table('cajas_sesiones', fn (Blueprint $t) => $t->dropForeign(DB::getDriverName() === 'sqlite' ? [$column] : $fk['name']));
            Schema::table('cajas_sesiones', fn (Blueprint $t) => $t->foreign($column)->references('id')->on($parent)->restrictOnDelete());
        }
    }
    public function down(): void
    {
        throw new RuntimeException('Las sesiones conservan su identidad; utiliza una migración correctiva.');
    }
};
