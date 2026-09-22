<?php

namespace App\Observers;

use App\Models\Pedido;

class PedidoObserver
{
    /**
     * Handle the Pedido "created" event.
     */
    public function created(Pedido $pedido): void
    {
        //
    }

    public function updated(Pedido $pedido): void
    {
        if ($pedido->isDirty('estado') && $pedido->estado === 'entregado' && $pedido->usuario_id) {
            $user = $pedido->cliente;
            if ($user) {
                // Earn 1 point per 10 currency units spent
                $points = (int) floor($pedido->total / 10);
                
                if ($points > 0) {
                    $user->increment('loyalty_points', $points);
                    
                    \App\Models\LoyaltyPointsHistory::create([
                        'usuario_id' => $user->id,
                        'points' => $points,
                        'type' => 'earned',
                        'description' => "Puntos obtenidos por pedido #{$pedido->id}",
                    ]);
                }
            }
        }
    }

    /**
     * Handle the Pedido "deleted" event.
     */
    public function deleted(Pedido $pedido): void
    {
        //
    }

    /**
     * Handle the Pedido "restored" event.
     */
    public function restored(Pedido $pedido): void
    {
        //
    }

    /**
     * Handle the Pedido "force deleted" event.
     */
    public function forceDeleted(Pedido $pedido): void
    {
        //
    }
}
