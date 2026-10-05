<?php

namespace App\Services;

use App\Models\Pedido;

class FacturacionService
{
    public function emitirComprobante(Pedido $pedido): array
    {
        $result = app(SunatService::class)->emitirComprobante($pedido);

        return [
            'exito' => (bool) ($result['success'] ?? false),
            'error' => $result['error'] ?? $result['message'] ?? null,
            'enlace_pdf' => $result['pdf'] ?? $pedido->enlace_pdf,
            'enlace_xml' => $result['xml'] ?? $pedido->enlace_xml,
        ];
    }
}
