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
        if ($order->getAttribute('seed_batch')) return;
        $user = $order->usuario;
        $address = $order->direccion_envio_snapshot ?? [];
        $payload = ['codigo' => $order->codigo, 'estado' => $order->estado, 'nombres' => $address['nombres'] ?? $user?->nombres ?? 'Cliente',
            'tracking_number' => $order->tracking_number, 'courier_name' => $order->courier_name,
            'delivery_status' => $order->envio?->estado, 'pickup' => $address['pickup'] ?? null];
        foreach (['email' => $address['email'] ?? $user?->email, 'whatsapp' => $address['celular'] ?? $user?->telefono] as $channel => $destination) {
            if (! $destination || ($channel === 'email' && ! filter_var($destination, FILTER_VALIDATE_EMAIL))) {
                continue;
            }
            $id = DB::table('order_notification_outbox')->insertGetId(['pedido_id' => $order->id, 'channel' => $channel,
                'destination' => $destination, 'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
            DB::afterCommit(function () use ($id) {
                try {
                    DeliverOrderNotificationJob::dispatch($id)->onConnection(config('storefront.queue_connection'))->onQueue('storefront');
                } catch (\Throwable $e) {
                    report($e);
                } // The scheduler recovers persisted pending rows.
            });
        }
    }
}
