<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('crm_companies', function (Blueprint $table) {
            if (!Schema::hasColumn('crm_companies', 'ruc')) {
                $table->string('ruc', 20)->nullable()->after('nombre');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_companies', function (Blueprint $table) {
            if (Schema::hasColumn('crm_companies', 'ruc')) {
                $table->dropColumn('ruc');
            }
        });
    }
};
