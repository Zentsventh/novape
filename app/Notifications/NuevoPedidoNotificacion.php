<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NuevoPedidoNotificacion extends Notification
{
    use Queueable;

    public $pedido;
    public $mensaje;

    /**
     * Create a new notification instance.
     */
    public function __construct($pedido, $mensaje = null)
    {
        $this->pedido = $pedido;
        $this->mensaje = $mensaje ?? ("Nuevo pedido #{$pedido->id} recibido.");
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'pedido_id' => $this->pedido->id,
            'mensaje' => $this->mensaje,
            'total' => $this->pedido->total,
        ];
    }
}
