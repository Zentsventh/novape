<?php

declare(strict_types=1);

namespace App\Services\Admin\Invoices;

use App\Models\Pedido;

/** @deprecated Use App\Services\SunatService directly. */
class SunatService
{
    public function emitirComprobante(Pedido $pedido): ?string
    {
        $result = app(\App\Services\SunatService::class)->emitirComprobante($pedido);

        return ($result['success'] ?? false) ? $pedido->enlace_pdf : null;
    }
}
