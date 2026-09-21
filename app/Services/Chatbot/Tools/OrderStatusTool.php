<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

use App\Models\Pedido;

class OrderStatusTool implements ToolInterface
{
    public function getName(): string
    {
        return 'consultar_estado_pedido';
    }

    public function getDescription(): string
    {
        return 'Consulta el estado actual de un pedido utilizando su código único.';
    }

    public function getParametersSchema(): array
    {
        return [
            'type' => 'OBJECT',
            'properties' => [
                'codigo_pedido' => [
                    'type' => 'STRING',
                    'description' => 'El código del pedido (ej. PED-0001)'
                ]
            ],
            'required' => ['codigo_pedido']
        ];
    }

    public function execute(array $args): mixed
    {
        $codigo = $args['codigo_pedido'] ?? '';

        if (empty(trim($codigo))) {
            return ['error' => 'Código de pedido requerido.'];
        }

        try {
            $pedido = Pedido::where('codigo', $codigo)->first();

            if (!$pedido) {
                return ['message' => 'No se encontró ningún pedido con el código: ' . $codigo];
            }

            return [
                'codigo' => $pedido->codigo,
                'estado' => $pedido->estado,
                'fecha_creacion' => $pedido->created_at->format('Y-m-d H:i'),
                'total_pagado' => $pedido->total,
                'courier' => $pedido->courier_name ?? 'No asignado',
                'tracking' => $pedido->tracking_number ?? 'N/A'
            ];
        } catch (\Exception $e) {
            return ['error' => 'Ocurrió un error al consultar la base de datos de pedidos.'];
        }
    }
}
