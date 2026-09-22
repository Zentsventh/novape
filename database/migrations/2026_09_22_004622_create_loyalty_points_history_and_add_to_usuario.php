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
            $table->integer('loyalty_points')->default(0)->after('estado');
        });

        Schema::create('loyalty_points_history', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('usuario_id');
            $table->integer('points');
            $table->string('type'); // earned, redeemed
            $table->string('description')->nullable();
            $table->timestamps();

            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_points_history');
        Schema::table('usuario', function (Blueprint $table) {
            $table->dropColumn('loyalty_points');
        });
    }
};
