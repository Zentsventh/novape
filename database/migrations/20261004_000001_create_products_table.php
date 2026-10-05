<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        // No‑op migration – actual products table created in later migration (000004)
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        // No‑op
    }
};
?>

