<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_activities', function (Blueprint $table) {
            $table->unsignedBigInteger('deal_id')->nullable()->change();
            $table->foreignId('empresa_id')->nullable()->constrained('crm_companies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (DB::table('crm_activities')->whereNull('deal_id')->exists()) {
            throw new RuntimeException('Asocia las tareas de empresa a una oportunidad antes de revertir esta migración.');
        }
        Schema::table('crm_activities', function (Blueprint $table) {
            $table->dropConstrainedForeignId('empresa_id');
            $table->unsignedBigInteger('deal_id')->nullable(false)->change();
        });
    }
};
