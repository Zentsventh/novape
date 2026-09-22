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
        Schema::create('rma_requests', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('usuario_id');
            $table->unsignedBigInteger('pedido_id')->nullable();
            $table->unsignedBigInteger('producto_id')->nullable(); // Can be null if the request is for the whole order
            $table->string('type'); // return, exchange, warranty
            $table->string('status')->default('pending'); // pending, approved, rejected, received, processed
            $table->string('reason'); // defective, wrong_item, changed_mind, other
            $table->text('description')->nullable();
            $table->json('images')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();

            // Let's add foreign key constraints but properly
            $table->foreign('usuario_id')->references('id')->on('usuario')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rma_requests');
    }
};
