<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Tools;

use App\Models\Pedido;

class OrderStatusTool implements ToolInterface
{
    public function __construct(private ?int $verifiedCustomerId = null) {}

    public function getName(): string { return 'consultar_estado_pedido'; }

    public function getDescription(): string
    {
        return 'Consulta un pedido del cliente autenticado. Un código de pedido por sí solo no acredita identidad.';
    }

    public function getParametersSchema(): array
    {
        return ['type' => 'OBJECT', 'properties' => ['codigo_pedido' => ['type' => 'STRING']], 'required' => ['codigo_pedido']];
    }

    public function execute(array $args): mixed
    {
        if (! $this->verifiedCustomerId) {
            return ['message' => 'Inicia sesión en tu cuenta de la tienda para consultar tus pedidos, o solicita ayuda de un asesor para verificar tu identidad.'];
        }
        $code = trim((string) ($args['codigo_pedido'] ?? ''));
        $order = Pedido::where('usuario_id', $this->verifiedCustomerId)->where('codigo', $code)->first();
        if (! $order) {
            return ['message' => 'No se encontró ese pedido en tu cuenta.'];
        }

        return ['codigo' => $order->codigo, 'estado' => $order->estado, 'fecha_creacion' => $order->created_at->format('Y-m-d H:i'),
            'total_pagado' => $order->total, 'courier' => $order->courier_name ?? 'Por asignar', 'tracking' => $order->tracking_number];
    }
}