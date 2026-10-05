<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class NiubizMigrationTest extends TestCase
{
    public function test_existing_transaction_records_keep_their_reference(): void
    {
        Schema::create('transacciones_pago', function (Blueprint $table) {
            $table->id();
            $table->string('payment_intent_id')->nullable();
            $table->string('pasarela')->default('niubiz');
            $table->decimal('monto', 10, 2);
            $table->string('estado');
            $table->timestamps();
        });
        DB::table('transacciones_pago')->insert([
            'payment_intent_id' => 'token-existente',
            'pasarela' => 'niubiz',
            'monto' => 25,
            'estado' => 'exitoso',
        ]);

        $migration = require database_path('migrations/2026_10_03_000001_use_niubiz_transaction_reference.php');
        $migration->up();

        $this->assertTrue(Schema::hasColumn('transacciones_pago', 'referencia_pasarela'));
        $this->assertSame('token-existente', DB::table('transacciones_pago')->value('referencia_pasarela'));

        Schema::dropIfExists('transacciones_pago');
    }
}
