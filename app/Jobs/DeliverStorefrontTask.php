<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\AbandonedCartMail;
use App\Models\Carrito;
use App\Models\Pedido;
use App\Services\Marketing\MarketingConsent;
use App\Services\Omnichannel\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class DeliverStorefrontTask implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;
    public int $timeout = 120;

    public function __construct(public int $taskId) {}

    public function handle(): void
    {
        $row = DB::table('storefront_tasks')->find($this->taskId);
        if (!is_object($row) || ! in_array($row->status, ['pending', 'blocked'], true)) return;
        $missing = match ($row->kind) {
            'confirmation_email', 'cart_recovery' => in_array(config('mail.default'), ['log', 'array'], true) && ! app()->environment('testing'),
            'invoice' => ! config('services.apiperu.url') || ! config('services.apiperu.token') || config('services.apiperu.token') === 'SIMULACION_TOKEN',
            'confirmation_whatsapp' => ! \App\Models\ConfiguracionSitio::obtener('whatsapp_token', config('services.whatsapp.token')) || ! \App\Models\ConfiguracionSitio::obtener('whatsapp_phone_number_id', config('services.whatsapp.phone_number_id')),
            default => true,
        };
        if ($missing) {
            DB::table('storefront_tasks')->where('id', $row->id)->whereIn('status', ['pending', 'blocked'])->update([
                'status' => 'blocked', 'error' => 'Configura el proveedor antes de ejecutar esta tarea.', 'available_at' => now()->addMinutes(5), 'updated_at' => now()]);
            return;
        }
        if (! DB::table('storefront_tasks')->where('id', $row->id)->whereIn('status', ['pending', 'blocked'])->update([
            'status' => 'processing', 'attempts' => DB::raw('attempts + 1'), 'started_at' => now(), 'updated_at' => now()])) return;
        try {
            $payload = json_decode($row->payload, true, flags: JSON_THROW_ON_ERROR);
            if ($row->kind === 'confirmation_email') {
                (new SendOrderConfirmationJob($row->pedido_id, $row->destination))->handle();
            } elseif ($row->kind === 'invoice') {
                $order = Pedido::findOrFail($row->pedido_id);
                (new ProcessSunatInvoiceJob($order))->handle(app(\App\Services\SunatService::class));
            } elseif ($row->kind === 'confirmation_whatsapp') {
                $result = app(WhatsAppService::class)->sendTextMessage($row->destination,
                    'Hola '.$payload['nombres'].'. Confirmamos tu pedido '.$payload['codigo'].' por S/ '.$payload['total'].'.');
                if (! ($result['success'] ?? false)) throw new \RuntimeException('El proveedor no confirmó el envío.');
            } elseif ($row->kind === 'cart_recovery') {
                if (!isset($payload['cart_id']) || !is_int($payload['cart_id'])) throw new \RuntimeException('La tarea no tiene un carrito válido.');
                $cart = Carrito::with(['usuario', 'items.variante.producto.imagenes'])->find($payload['cart_id']);
                if (! $cart || ! $cart->usuario || ! MarketingConsent::allows($cart->usuario) || ! $cart->items->count()
                    || $cart->updated_at->timestamp !== $payload['activity'] || $cart->usuario->email !== $row->destination) {
                    DB::table('storefront_tasks')->where('id', $row->id)->update(['status' => 'skipped', 'updated_at' => now()]);
                    return;
                }
                Mail::to($row->destination)->send(new AbandonedCartMail($cart->usuario, $cart->items));
                DB::table('carrito')->where('id', $cart->id)->where('updated_at', $cart->updated_at)->update(['notified_at' => now()]);
            }
            DB::table('storefront_tasks')->where('id', $row->id)->update(['status' => 'sent', 'error' => null, 'updated_at' => now()]);
        } catch (\Throwable $e) {
            DB::table('storefront_tasks')->where('id', $row->id)->update(['status' => 'needs_review', 'error' => mb_substr($e->getMessage(), 0, 1000), 'updated_at' => now()]);
            report($e);
        }
    }
}
