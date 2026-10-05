<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;
use App\Support\Csv;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportOrderService
{
    public function exportDownload(): StreamedResponse
    {
        $rows = Pedido::with('usuario')->lazyById(500)->map(fn ($p) => [
            $p->id, $p->codigo, $p->usuario ? $p->usuario->nombres.' '.$p->usuario->apellidos : 'N/A',
            $p->usuario?->email ?? '', $p->total, $p->estado, $p->created_at,
        ]);

        return Csv::download(['ID', 'Código', 'Cliente', 'Email', 'Total', 'Estado', 'Fecha'], $rows, 'pedidos_'.date('Y-m-d').'.csv');
    }

    /**
     * Generates CSV content for orders.
     * Uses chunking to prevent memory issues with large datasets.
     */
    public function exportCsv(): string
    {
        $csv = "ID,Código,Cliente,Email,Total,Estado,Fecha\n";

        Pedido::with('usuario')->chunkById(500, function ($pedidos) use (&$csv) {
            foreach ($pedidos as $p) {
                $clienteNombre = $p->usuario ? $p->usuario->nombres.' '.$p->usuario->apellidos : 'N/A';
                $email = $p->usuario ? $p->usuario->email : '';

                $csv .= Csv::row([
                    $p->id,
                    $p->codigo,
                    $clienteNombre,
                    $email,
                    $p->total,
                    $p->estado,
                    $p->created_at,
                ]);
            }
        });

        return $csv;
    }
}
