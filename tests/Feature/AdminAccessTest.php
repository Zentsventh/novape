<?php

namespace Tests\Feature;

use App\Models\Rol;
use App\Models\Usuario;
use App\Services\Admin\Roles\RolePermissionService;
use App\Services\Admin\Users\UserManagementService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    public function test_specialized_staff_lands_in_a_permitted_module(): void
    {
        $user = $this->createUser('marketing');
        $permissionId = DB::table('permiso')->insertGetId(['nombre' => 'marketing.gestionar']);
        DB::table('rol_permiso')->insert(['rol_id' => $user->roles()->first()->id, 'permiso_id' => $permissionId]);
        $this->post('/admin/login', ['email' => $user->email, 'password' => 'securepass123'])
            ->assertRedirect('/admin/marketing/campaigns');
    }

    public function test_staff_without_any_module_receives_a_clear_login_error(): void
    {
        $user = $this->createUser('sinmodulos');
        $this->post('/admin/login', ['email' => $user->email, 'password' => 'securepass123'])->assertSessionHasErrors('email');
        $this->assertGuest('admin');
    }

    public function test_customer_import_rejects_empty_csv_without_server_error(): void
    {
        $user = $this->createUser('admin');
        $this->actingAs($user, 'admin')->postJson('/admin/clientes/importar/process', [
            'file' => UploadedFile::fake()->createWithContent('clientes.csv', ''),
            'mapping' => ['nombres' => 'Nombre'],
        ])->assertUnprocessable();
    }

    public function test_customer_import_rejects_unknown_columns_before_writing(): void
    {
        $user = $this->createUser('admin');
        $this->actingAs($user, 'admin')->postJson('/admin/clientes/importar/process', [
            'file' => UploadedFile::fake()->createWithContent('clientes.csv', "Nombre\nCliente\n"),
            'mapping' => ['nombres' => 'ColumnaInexistente'],
        ])->assertUnprocessable();
        $this->assertSame(1, Usuario::count());
    }

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

    public function test_blocked_staff_with_existing_session_cannot_access_admin(): void
    {
        $user = $this->createUser('admin');
        $user->estado = 'bloqueado';
        $this->actingAs($user, 'admin')->get('/admin/gastos')->assertForbidden();
    }

    public function test_admin_logout_does_not_accept_get(): void
    {
        $this->get('/admin/logout')->assertStatus(405);
    }

    public function test_non_admin_staff_cannot_assign_administrator_role(): void
    {
        $user = $this->createUser('cajero');
        $adminRoleId = DB::table('rol')->insertGetId(['nombre' => 'admin']);
        $this->actingAs($user, 'admin');
        $this->expectException(HttpException::class);
        app(UserManagementService::class)->createUser(['roles' => [$adminRoleId]], true);
    }

    public function test_last_administrator_cannot_remove_own_admin_role(): void
    {
        $user = $this->createUser('admin');
        $this->actingAs($user, 'admin');
        $this->expectException(ValidationException::class);
        app(UserManagementService::class)->updateUser($user, ['roles' => []], true);
    }

    public function test_base_role_cannot_be_renamed(): void
    {
        $this->createUser('admin');
        $role = Rol::where('nombre', 'admin')->firstOrFail();
        $this->expectException(ValidationException::class);
        app(RolePermissionService::class)->updateRole($role, ['nombre' => 'otro']);
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
