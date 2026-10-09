<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('imagen_mobile_url', 500)->nullable();
            $table->text('fuente_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('banners', fn (Blueprint $table) => $table->dropColumn(['imagen_mobile_url', 'fuente_url']));
    }
};
