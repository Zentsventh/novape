<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comprobantes', function (Blueprint $t) {
            $t->dropUnique('comprobantes_fiscal_identity_unique');
            $t->dropColumn('fiscal_identity');
        });
        $number = DB::getDriverName() === 'mysql' ? "COALESCE(NULLIF(TRIM(LEADING '0' FROM numero), ''), '0')" : "COALESCE(NULLIF(ltrim(numero, '0'), ''), '0')";
        $expression = DB::getDriverName() === 'mysql'
            ? "CASE WHEN fiscal_environment <> 'demo' AND serie IS NOT NULL AND numero IS NOT NULL THEN CONCAT(fiscal_environment, ':', issuer_tax_id, ':', tipo, ':', serie, ':', $number) ELSE NULL END"
            : "CASE WHEN fiscal_environment <> 'demo' AND serie IS NOT NULL AND numero IS NOT NULL THEN fiscal_environment || ':' || issuer_tax_id || ':' || tipo || ':' || serie || ':' || $number ELSE NULL END";
        Schema::table('comprobantes', fn (Blueprint $t) => $t->string('fiscal_identity')->nullable()->storedAs($expression)->unique());
    }
    public function down(): void
    {
        throw new RuntimeException('La identidad fiscal se protege en la base; utiliza una migración correctiva.');
    }
};
