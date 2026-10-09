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
        Schema::table('usuario', function (Blueprint $table) {
            if (!Schema::hasColumn('usuario', 'tipo_documento')) {
                $table->string('tipo_documento', 20)->nullable()->after('apellidos');
            }
            if (!Schema::hasColumn('usuario', 'dni')) {
                $table->string('dni', 20)->nullable()->after('tipo_documento');
            }
            if (!Schema::hasColumn('usuario', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuario', function (Blueprint $table) {
            //
        });
    }
};
