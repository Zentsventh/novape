<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            $table->unsignedBigInteger('empresa_id')->nullable()->after('id');
            $table->foreign('empresa_id')
                  ->references('id')
                  ->on('crm_companies')
                  ->nullOnDelete();
            $table->index('empresa_id');
        });

        Schema::table('crm_deals', function (Blueprint $table) {
            $table->unsignedBigInteger('empresa_id')->nullable()->after('usuario_id');
            $table->foreign('empresa_id')
                  ->references('id')
                  ->on('crm_companies')
                  ->nullOnDelete();
            $table->index('empresa_id');
        });
    }

    public function down(): void
    {
        Schema::table('crm_deals', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropColumn('empresa_id');
        });

        Schema::table('usuario', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropColumn('empresa_id');
        });
    }
};
