<?php

namespace Tests\Feature;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

// Audit reproduction only: SQLite in memory through phpunit.xml.
class AdminSecurityRegressionTest extends AdminAccessTest
{
    public function test_audit_excludes_credentials_and_records_admin_actor(): void
    {
        $userId = DB::table('usuario')->insertGetId(['email' => 'audit-hash@example.test', 'password_hash' => 'hash-before', 'estado' => 'activo']);
        $user = Usuario::findOrFail($userId);
        $this->actingAs($user, 'admin');
        $user->password_hash = 'hash-after';
        $user->setAuditEvent('updated');
        $audit = $user->toAudit();
        $this->assertArrayNotHasKey('password_hash', $audit['old_values']);
        $this->assertArrayNotHasKey('password_hash', $audit['new_values']);
        $this->assertEquals($userId, $audit['user_id']);
    }

    public function test_staff_cannot_escalate_its_role_permissions(): void
    {
        $userId = DB::table('usuario')->insertGetId(['email' => 'audit@example.test', 'password_hash' => 'unused', 'estado' => 'activo']);
        $roleId = DB::table('rol')->insertGetId(['nombre' => 'supervisor', 'descripcion' => 'Supervisor']);
        DB::table('usuario_rol')->insert(['usuario_id' => $userId, 'rol_id' => $roleId]);
        $manageId = DB::table('permiso')->insertGetId(['nombre' => 'usuarios.gestionar']);
        $financeId = DB::table('permiso')->insertGetId(['nombre' => 'finanzas.gestionar']);
        DB::table('rol_permiso')->insert(['rol_id' => $roleId, 'permiso_id' => $manageId]);
        $user = Usuario::findOrFail($userId);
        $this->assertFalse($user->tienePermiso('finanzas.gestionar'));
        $this->actingAs($user, 'admin')->put('/admin/roles/'.$roleId, ['nombre' => 'supervisor', 'descripcion' => 'Supervisor', 'permisos' => [$manageId, $financeId]])->assertForbidden();
        $this->assertFalse($user->fresh()->tienePermiso('finanzas.gestionar'));
    }
}
