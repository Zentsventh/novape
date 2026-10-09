<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('omnichannel_contact_locks', function (Blueprint $table) {
            $table->string('phone_number', 20)->primary();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('omnichannel_contact_locks');
    }
};
