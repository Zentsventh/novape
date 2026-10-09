<?php

namespace App\Observers;

use App\Models\Pedido;
use App\Services\Orders\OrderLoyaltyService;

class PedidoObserver
{
    public function updated(Pedido $pedido): void
    {
        if ($pedido->wasChanged('estado') && strtolower($pedido->estado) === 'completado') {
            OrderLoyaltyService::completed($pedido);
        }
    }
}
