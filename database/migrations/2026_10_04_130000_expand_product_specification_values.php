<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('producto_especificaciones', fn(Blueprint $table) => $table->text('valor')->change());
    }

    public function down(): void
    {
        // Keep complete imported specifications; a rollback must not truncate source facts.
    }
};
