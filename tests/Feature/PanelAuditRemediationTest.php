<?php

namespace Tests\Feature;

use App\Models\{CrmDeal, Page, Permiso, Promocion, Rol, Usuario};
use App\Services\CrmAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Http, Mail, Queue};
use Tests\TestCase;

class PanelAuditRemediationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests(); Mail::fake(); Queue::fake();
        config(['audit.enabled' => false, 'inertia.ssr.enabled' => false]);
    }

    private function staff(string $role = 'admin', array $permissions = []): Usuario
    {
        $user = Usuario::factory()->create();
        $role = Rol::firstOrCreate(['nombre' => $role], ['descripcion' => 'Pruebas']);
        foreach ($permissions as $name) {
            $permission = Permiso::firstOrCreate(['nombre' => $name], ['descripcion' => 'Pruebas']);
            $role->permisos()->syncWithoutDetaching([$permission->id]);
        }
        $user->roles()->attach($role->id);
        return $user;
    }

    public function test_promotion_edit_update_and_delete_use_the_requested_record(): void
    {
        $this->actingAs($this->staff(), 'admin');
        $promo = Promocion::create(['nombre'=>'Original', 'tipo_descuento'=>'porcentaje', 'valor_descuento'=>10, 'activa'=>true]);
        $other = Promocion::create(['nombre'=>'Otra', 'tipo_descuento'=>'porcentaje', 'valor_descuento'=>5, 'activa'=>true]);
        $this->get('/admin/promociones/'.$promo->id.'/edit')->assertOk()->assertInertia(fn ($page) => $page->where('promocion.id', $promo->id));
        $this->put('/admin/promociones/'.$promo->id, ['nombre'=>'Editada', 'tipo_descuento'=>'porcentaje', 'valor_descuento'=>20, 'activa'=>true, 'productos'=>[]])->assertRedirect('/admin/promociones');
        $this->assertSame('Editada', $promo->fresh()->nombre);
        $this->assertSame('Otra', $other->fresh()->nombre);
        $this->delete('/admin/promociones/'.$promo->id)->assertRedirect('/admin/promociones');
        $this->assertDatabaseMissing('promociones', ['id'=>$promo->id]);
        $this->get('/admin/promociones/'.$promo->id.'/edit')->assertNotFound();
        $this->put('/admin/promociones/'.$promo->id, [])->assertNotFound();
        $this->delete('/admin/promociones/'.$promo->id)->assertNotFound();
    }

    public function test_cms_removes_active_content_and_preserves_editorial_formatting(): void
    {
        $this->actingAs($this->staff(), 'admin');
        $payload = '<p onclick="alert(1)">Hola <strong>mundo</strong> <a href="https://example.test">Enlace</a></p><script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">Peligro</a><svg onload="alert(1)"></svg><iframe src="https://example.test"></iframe>';
        $this->post('/admin/pages', ['slug'=>'nosotros', 'title'=>'Nosotros', 'is_active'=>true, 'sections'=>[['heading'=>'Historia', 'body'=>$payload]]])->assertSessionHasNoErrors()->assertRedirect('/admin/pages');
        $body = Page::firstOrFail()->sections[0]['body'];
        foreach (['onclick', 'onerror', '<script', '<img', 'javascript:', '<svg', '<iframe'] as $unsafe) $this->assertStringNotContainsString($unsafe, $body);
        $this->assertStringContainsString('<strong>mundo</strong>', $body);
        $this->assertStringContainsString('href="https://example.test"', $body);
        $this->get('/nosotros')->assertOk()->assertInertia(fn ($page) => $page->where('sections.0.body', $body));
    }

    public function test_cms_protects_legacy_content_and_rejects_unknown_slugs_or_malformed_sections(): void
    {
        Page::create(['slug'=>'nosotros', 'title'=>'Anterior', 'is_active'=>true, 'sections'=>[['heading'=>'Historia', 'body'=>'<p onmouseover="alert(1)">Texto</p>']]]);
        $this->get('/nosotros')->assertInertia(fn ($page) => $page->where('sections.0.body', '<p>Texto</p>'));
        $this->actingAs($this->staff(), 'admin');
        $this->post('/admin/pages', ['slug'=>'no-existe', 'title'=>'Otra', 'is_active'=>true, 'sections'=>[]])->assertSessionHasErrors('slug');
        $this->post('/admin/pages', ['slug'=>'faq', 'title'=>'FAQ', 'is_active'=>true, 'sections'=>[['heading'=>[], 'body'=>[]]]])->assertSessionHasErrors(['sections.0.heading', 'sections.0.body']);
        $this->assertDatabaseMissing('pages', ['slug'=>'no-existe']);
    }

    public function test_unpublished_cms_content_is_not_exposed_and_updates_preserve_the_page(): void
    {
        $this->actingAs($this->staff(), 'admin');
        $page = Page::create(['slug'=>'faq', 'title'=>'Original', 'is_active'=>true, 'sections'=>[['heading'=>'Private', 'body'=>'Secreto editorial']]]);
        $this->put('/admin/pages/'.$page->id, ['slug'=>'faq', 'title'=>'Editada', 'is_active'=>false, 'sections'=>[['heading'=>'Private', 'body'=>'Secreto editorial']]])->assertSessionHasNoErrors()->assertRedirect('/admin/pages');
        $this->assertSame('Editada', $page->fresh()->title);
        $this->get('/faq')->assertOk()->assertInertia(fn ($props) => $props->where('title', 'Preguntas frecuentes')->where('sections.0.heading', 'Envios'));
    }

    public function test_crm_exports_only_contacts_and_excludes_mixed_staff_roles(): void
    {
        $actor = $this->staff('asesor', ['crm.gestionar']);
        $admin = $this->staff();
        $mixed = $this->staff('almacen');
        $customer = $this->staff('cliente');
        $unassigned = Usuario::factory()->create();
        $mixed->roles()->attach($customer->roles()->first()->id);
        $this->actingAs($actor, 'admin');
        $this->assertFalse($actor->tienePermiso('ver_usuarios'));
        $csv = $this->get('/admin/crm/export?type=personas')->assertOk()->streamedContent();
        foreach ([$actor, $admin, $mixed] as $staff) $this->assertStringNotContainsString($staff->email, $csv);
        foreach ([$customer, $unassigned] as $contact) $this->assertStringContainsString($contact->email, $csv);
    }

    public function test_staff_editor_can_change_profile_but_cannot_change_privileges(): void
    {
        $actor = $this->staff('editor', ['editar_usuario']);
        $target = $this->staff('almacen');
        $admin = $this->staff();
        $this->actingAs($actor, 'admin');
        $roles = $target->roles()->pluck('rol.id')->all();
        $data = ['nombres'=>'Editado', 'apellidos'=>$target->apellidos, 'email'=>$target->email, 'roles'=>$roles];
        $this->put('/admin/trabajadores/'.$target->id, $data)->assertRedirect('/admin/trabajadores');
        $this->assertSame('Editado', $target->fresh()->nombres);
        $this->put('/admin/trabajadores/'.$target->id, array_replace($data, ['roles'=>[$admin->roles()->first()->id]]))->assertForbidden();
        $this->assertSame($roles, $target->roles()->pluck('rol.id')->all());
        unset($data['roles']);
        $this->put('/admin/trabajadores/'.$target->id, $data)->assertRedirect('/admin/trabajadores');
        $this->put('/admin/trabajadores/'.$admin->id, ['nombres'=>'Ataque', 'apellidos'=>$admin->apellidos, 'email'=>$admin->email])->assertForbidden();
    }

    public function test_crm_dashboard_works_on_sqlite_and_excludes_archived_deals_everywhere(): void
    {
        $user = $this->staff();
        $pipeline = DB::table('crm_pipelines')->insertGetId(['nombre'=>'Ventas']);
        $stage = DB::table('crm_stages')->insertGetId(['pipeline_id'=>$pipeline, 'nombre'=>'Cierre', 'orden'=>1, 'color'=>'#123456']);
        foreach ([['won', 100, null], ['open', 50, null], ['won', 9999, now()]] as [$state, $value, $deleted]) {
            $id = DB::table('crm_deals')->insertGetId(['usuario_id'=>$user->id, 'stage_id'=>$stage, 'titulo'=>'Venta', 'estado'=>$state, 'valor'=>$value, 'created_at'=>now()->subDays(4), 'updated_at'=>now(), 'deleted_at'=>$deleted]);
            DB::table('crm_activities')->insert(['deal_id'=>$id, 'usuario_id'=>$user->id, 'tipo'=>'nota', 'contenido'=>'Registro']);
        }
        $metrics = app(CrmAnalyticsService::class)->getDashboardMetrics();
        $this->assertSame(2, $metrics['kpis']['total_deals']);
        $this->assertEquals(100, $metrics['kpis']['total_revenue']);
        $this->assertEquals(4, $metrics['kpis']['deal_velocity']);
        $this->assertEquals(2, $metrics['funnel'][0]['value']);
        $this->assertEquals(100, $metrics['monthly_sales'][0]['Ventas']);
        $this->assertCount(1, $metrics['scatter_data']);
        $this->assertEquals(1, $metrics['pipeline_forecast'][0]['won']);
        $this->assertEquals(1, $metrics['win_loss_ratio'][0]['value']);
        $this->assertEquals(100, $metrics['leaderboard'][0]['total_ventas']);
        $this->actingAs($user, 'admin')->get('/admin/crm/dashboard')->assertOk();
    }

    public function test_all_registered_admin_actions_exist(): void
    {
        foreach (app('router')->getRoutes() as $route) {
            if (!str_starts_with($route->uri(), 'admin') || !str_contains($route->getActionName(), '@')) continue;
            [$class, $method] = explode('@', $route->getActionName());
            $this->assertTrue(method_exists($class, $method), $route->uri().' => '.$route->getActionName());
        }
    }
}
