<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AdminRouteIntegrityTest extends TestCase
{
    public function test_all_admin_controller_routes_have_callable_actions(): void
    {
        $checked = 0;
        $missing = [];
        foreach (Route::getRoutes() as $route) {
            $action = $route->getActionName();
            if (! str_contains($action, 'App\\Http\\Controllers\\Admin\\')) {
                continue;
            }
            [$class, $method] = explode('@', $action);
            if (! class_exists($class) || ! method_exists($class, $method) || ! (new \ReflectionMethod($class, $method))->isPublic()) {
                $missing[] = $route->uri().' apunta a '.$action;
            }
            $checked++;
        }
        $this->assertGreaterThan(100, $checked);
        $this->assertSame([], $missing);
    }

    public function test_public_invoice_urls_cannot_be_guessed_without_signature(): void
    {
        $this->get('/comprobante/T001-000001')->assertForbidden();
        $this->get('/comprobante/ecommerce/PED-1')->assertForbidden();
    }

    public function test_unfinished_inventory_prototype_is_not_exposed_anonymously(): void
    {
        $this->getJson('/api/inventory/stocks')->assertNotFound();
        $this->postJson('/api/inventory/stocks', ['quantity' => 10])->assertNotFound();
        $this->getJson('/api/inventory/warehouses')->assertNotFound();
    }

    public function test_document_lookup_rejects_array_input_without_server_error(): void
    {
        $this->postJson('/api/documento/consultar', ['tipo' => 'DNI', 'numero' => ['12345678']])->assertUnprocessable();
    }
}
