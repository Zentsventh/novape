<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Jobs\DeliverOrderNotificationJob;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;

final class OrderNotificationOutbox
{
    public static function record(Pedido $order): void
    {
        $user = $order->usuario;
        if (! $user) {
            return;
        }
        $payload = ['codigo' => $order->codigo, 'estado' => $order->estado, 'nombres' => $user->nombres,
            'tracking_number' => $order->tracking_number, 'courier_name' => $order->courier_name];
        foreach (['email' => $user->email, 'whatsapp' => $user->telefono] as $channel => $destination) {
            if (! $destination || ($channel === 'email' && ! filter_var($destination, FILTER_VALIDATE_EMAIL))) {
                continue;
            }
            $id = DB::table('order_notification_outbox')->insertGetId(['pedido_id' => $order->id, 'channel' => $channel,
                'destination' => $destination, 'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
            DB::afterCommit(function () use ($id) {
                try {
                    DeliverOrderNotificationJob::dispatch($id);
                } catch (\Throwable $e) {
                    report($e);
                } // The scheduler recovers persisted pending rows.
            });
        }
    }
}
