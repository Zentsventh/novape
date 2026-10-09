<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('categoria', function (Blueprint $table) {
            $table->string('fuente_url', 500)->nullable()->unique();
            $table->unsignedInteger('orden')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('categoria', function (Blueprint $table) {
            $table->dropUnique(['fuente_url']);
            $table->dropColumn(['fuente_url', 'orden']);
        });
    }
};
