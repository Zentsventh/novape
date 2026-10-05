<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Services\Api\DocumentApiService;
use App\Services\FacturacionService;
use App\Services\SunatService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class InvoiceConfigurationSafetyTest extends TestCase
{
    public function test_document_lookup_never_invents_customer_data_without_provider(): void
    {
        config(['services.apiperu.token' => null]);
        Http::fake();
        $result = app(DocumentApiService::class)->consultar('DNI', '12345678');
        $this->assertFalse($result['success']);
        $this->assertArrayNotHasKey('data', $result);
        Http::assertNothingSent();
    }

    public function test_document_lookup_reports_provider_failure_instead_of_mock_success(): void
    {
        config(['services.apiperu.token' => 'test-token', 'services.apiperu.document_url' => 'https://example.test/api']);
        Http::fake(['*' => Http::response(['success' => false], 503)]);
        $result = app(DocumentApiService::class)->consultar('RUC', '20123456789');
        $this->assertFalse($result['success']);
        $this->assertArrayNotHasKey('data', $result);
        Http::assertSentCount(1);
    }

    public function test_missing_provider_does_not_fake_invoice_success_or_call_network(): void
    {
        config(['services.apiperu.url' => null, 'services.apiperu.token' => null]);
        Http::fake();
        $pedido = new Pedido(['estado' => 'Pagado', 'codigo' => 'PED-TEST']);
        $result = app(SunatService::class)->emitirComprobante($pedido);
        $this->assertFalse($result['success']);
        $this->assertNull($pedido->facturado_sunat);
        $result = app(FacturacionService::class)->emitirComprobante($pedido);
        $this->assertFalse($result['exito']);
        $this->assertNull($result['enlace_pdf']);
        Http::assertNothingSent();
    }
}
