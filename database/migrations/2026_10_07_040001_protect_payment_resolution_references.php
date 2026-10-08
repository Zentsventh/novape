<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_resolution_events', fn (Blueprint $t) => $t->unique('provider_reference'));
    }

    public function down(): void
    {
        throw new RuntimeException('No elimines la protección de referencias sin revisar las operaciones registradas.');
    }
};
