<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('usuario', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('estado');
            $table->softDeletes();
            $table->timestamps();
        });
        Schema::create('rol', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('descripcion')->nullable();
        });
        Schema::create('usuario_rol', function (Blueprint $table) {
            $table->unsignedBigInteger('usuario_id');
            $table->unsignedBigInteger('rol_id');
        });
        Schema::create('permiso', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
        });
        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->unsignedBigInteger('rol_id');
            $table->unsignedBigInteger('permiso_id');
        });
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->text('payload');
            $table->integer('last_activity');
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('rol_permiso');
        Schema::dropIfExists('permiso');
        Schema::dropIfExists('usuario_rol');
        Schema::dropIfExists('rol');
        Schema::dropIfExists('usuario');
        parent::tearDown();
    }

    public function test_customer_cannot_sign_in_to_admin(): void
    {
        $this->createUser('cliente');

        $this->post('/admin/login', [
            'email' => 'persona@example.test',
            'password' => 'securepass123',
        ])->assertSessionHasErrors('email');

        $this->assertGuest('admin');
    }

    public function test_staff_can_sign_in_to_admin(): void
    {
        $this->createUser('admin');

        $this->post('/admin/login', [
            'email' => 'persona@example.test',
            'password' => 'securepass123',
        ])->assertRedirect('/admin');

        $this->assertAuthenticated('admin');
    }

    public function test_customer_with_admin_session_cannot_open_internal_routes(): void
    {
        $user = $this->createUser('cliente');

        $this->actingAs($user, 'admin')->get('/admin/gastos')->assertForbidden();
    }

    public function test_staff_without_module_permission_cannot_access_finance_or_crm(): void
    {
        $user = $this->createUser('cajero');

        $this->actingAs($user, 'admin')->get('/admin/gastos')->assertForbidden();
        $this->actingAs($user, 'admin')->get('/admin/crm/dashboard')->assertForbidden();
    }

    private function createUser(string $role): Usuario
    {
        $userId = DB::table('usuario')->insertGetId([
            'email' => 'persona@example.test',
            'password_hash' => Hash::make('securepass123'),
            'estado' => 'activo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $roleId = DB::table('rol')->insertGetId(['nombre' => $role]);
        DB::table('usuario_rol')->insert(['usuario_id' => $userId, 'rol_id' => $roleId]);

        return Usuario::findOrFail($userId);
    }
}
