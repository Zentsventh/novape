<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\OrderStatusUpdated;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Services\Omnichannel\WhatsAppService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class DeliverOrderNotificationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 45;

    public function __construct(public int $outboxId) {}

    public function handle(): void
    {
        if (! DB::table('order_notification_outbox')->where('id', $this->outboxId)->where('status', 'pending')->update(['status' => 'sending', 'updated_at' => now()])) {
            return;
        }
        $row = DB::table('order_notification_outbox')->where('id', $this->outboxId)->firstOrFail();
        $payload = json_decode($row->payload, true, flags: JSON_THROW_ON_ERROR);
        try {
            if ($row->channel === 'email') {
                if (in_array(config('mail.default'), ['log', 'array'], true) && ! app()->environment('testing')) {
                    throw new \RuntimeException('Configura el transporte de correo antes de entregar notificaciones.');
                }
                $order = new Pedido(['codigo' => $payload['codigo'], 'estado' => $payload['estado']]);
                $order->forceFill(['tracking_number' => $payload['tracking_number'] ?? null, 'courier_name' => $payload['courier_name'] ?? null,
                    'delivery_status' => $payload['delivery_status'] ?? null, 'pickup' => $payload['pickup'] ?? null]);
                $order->setRelation('usuario', new Usuario(['nombres' => $payload['nombres']]));
                Mail::to($row->destination)->send(new OrderStatusUpdated($order));
            } else {
                $message = 'Hola '.$payload['nombres'].'. Tu pedido '.$payload['codigo'].' está '.$payload['estado'].'.';
                if (! empty($payload['delivery_status'])) $message .= ' Entrega: '.$payload['delivery_status'].'.';
                if ($payload['tracking_number']) {
                    $message .= ' Rastreo: '.$payload['tracking_number'].' / '.$payload['courier_name'];
                }
                $response = app(WhatsAppService::class)->sendTextMessage($row->destination, $message);
                if (! ($response['success'] ?? false)) {
                    throw new \RuntimeException('WhatsApp no confirmó la entrega.');
                }
            }
            DB::table('order_notification_outbox')->where('id', $this->outboxId)->update(['status' => 'sent', 'updated_at' => now()]);
        } catch (\Throwable $e) {
            DB::table('order_notification_outbox')->where('id', $this->outboxId)->update(['status' => 'failed', 'error' => mb_substr($e->getMessage(), 0, 1000), 'updated_at' => now()]);
            report($e);
        }
    }
}
