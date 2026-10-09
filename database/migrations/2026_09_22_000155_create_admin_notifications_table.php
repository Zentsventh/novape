<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('user_id')->nullable();
            $table->foreign('user_id')->references('id')->on('usuario')->nullOnDelete();
            $table->string('type', 50);       // pedido_nuevo, stock_bajo, caso_asignado, etc.
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('icon', 20)->default('bell');  // bell, package, alert-triangle, etc.
            $table->string('color', 20)->default('blue');  // blue, red, green, yellow
            $table->string('link')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_notifications');
    }
};
