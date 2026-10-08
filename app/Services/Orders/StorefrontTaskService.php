<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Jobs\DeliverStorefrontTask;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;

final class StorefrontTaskService
{
    public static function record(string $key, string $kind, ?int $orderId, ?string $destination, array $payload = []): void
    {
        DB::table('storefront_tasks')->insertOrIgnore(['dedup_key' => $key, 'kind' => $kind, 'pedido_id' => $orderId,
            'destination' => $destination, 'payload' => json_encode($payload, JSON_THROW_ON_ERROR),
            'status' => 'pending', 'available_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        $id = DB::table('storefront_tasks')->where('dedup_key', $key)->value('id');
        DB::afterCommit(function () use ($id) {
            try {
                DeliverStorefrontTask::dispatch($id)->onConnection(config('storefront.queue_connection'))->onQueue('storefront');
            } catch (\Throwable $e) {
                report($e); // Persisted pending task is recovered independently of dispatch.
            }
        });
    }

    public static function recordPaid(Pedido $order, ?string $email = null): void
    {
        if ($order->getAttribute('seed_batch')) return;
        $address = $order->direccion_envio_snapshot ?? [];
        $email ??= $address['email'] ?? $order->usuario?->email;
        if (config('invoicing.notify_email') && $email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
            self::record('paid:'.$order->id.':email', 'confirmation_email', $order->id, $email);
        }
        $phone = $address['celular'] ?? $order->usuario?->telefono;
        if (config('invoicing.notify_whatsapp') && $phone) {
            self::record('paid:'.$order->id.':whatsapp', 'confirmation_whatsapp', $order->id, $phone,
                ['nombres' => $address['nombres'] ?? $order->usuario?->nombres ?? 'Cliente', 'codigo' => $order->codigo, 'total' => $order->total]);
        }
        self::record('paid:'.$order->id.':invoice', 'invoice', $order->id, null);
    }

    public static function recover(): void
    {
        DB::table('storefront_tasks')->whereIn('status', ['pending', 'blocked'])->where('available_at', '<=', now())
            ->orderBy('id')->limit(100)->get()->each(function ($row) {
                DeliverStorefrontTask::dispatch($row->id)->onConnection(config('storefront.queue_connection'))->onQueue('storefront');
            });
        // A killed worker might have reached the provider. Never resend that task automatically.
        DB::table('storefront_tasks')->where('status', 'processing')->where('started_at', '<', now()->subMinutes(10))
            ->update(['status' => 'needs_review', 'error' => 'El proceso se interrumpió; verifica entrega o emisión antes de reintentar.', 'updated_at' => now()]);
    }
}
