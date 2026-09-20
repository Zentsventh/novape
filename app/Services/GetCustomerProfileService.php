<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Usuario;

class GetCustomerProfileService
{
    public function execute(int $customerId): array
    {
        $customer = Usuario::query()
            ->withSum('pedidos as lifetime_value', 'total')
            ->withCount('pedidos')
            ->with(['pedidos' => fn ($q) => $q->latest()->take(5)])
            ->with(['notas' => fn ($q) => $q->latest()])
            ->with('notas.autor:id,nombres')
            ->with('direcciones')
            ->findOrFail($customerId);

        // RFM Segment Logic
        $ltv = $customer->lifetime_value ?? 0;
        $orderCount = $customer->pedidos_count;
        $segmento = 'Activo';
        $color = '#3b82f6'; // blue

        if ($orderCount === 0) {
            $segmento = 'Prospecto';
            $color = '#64748b'; // slate
        } else {
            $lastOrderDate = $customer->pedidos->first()?->created_at;
            if ($lastOrderDate && $lastOrderDate->diffInDays(now()) > 90) {
                $segmento = 'En Riesgo';
                $color = '#ef4444'; // red
            } elseif ($ltv >= 1000 || $orderCount >= 5) {
                $segmento = 'VIP';
                $color = '#eab308'; // yellow/gold
            }
        }

        return [
            'id' => $customer->id,
            'nombres' => $customer->nombres,
            'apellidos' => $customer->apellidos,
            'email' => $customer->email,
            'telefono' => $customer->telefono,
            'dni' => $customer->dni,
            'segmento' => [
                'nombre' => $segmento,
                'color' => $color
            ],
            'metricas' => [
                'total_pedidos' => $orderCount,
                'lifetime_value' => $ltv,
            ],
            'direcciones' => $customer->direcciones->map(fn($d) => [
                'id' => $d->id,
                'direccion' => $d->direccion,
                'referencia' => $d->referencia,
                'distrito' => $d->distrito,
                'principal' => $d->principal,
            ]),
            'ultimos_pedidos' => $customer->pedidos->map(fn($pedido) => [
                'id' => $pedido->id,
                'codigo' => $pedido->codigo,
                'total' => $pedido->total,
                'estado' => $pedido->estado,
                'fecha' => $pedido->created_at->format('d/m/Y H:i'),
            ]),
            'notas' => $customer->notas->map(fn($nota) => [
                'id' => $nota->id,
                'nota' => $nota->nota,
                'autor' => $nota->autor ? $nota->autor->nombres : 'Sistema',
                'fecha' => $nota->created_at->format('d/m/Y H:i'),
            ]),
        ];
    }
}
