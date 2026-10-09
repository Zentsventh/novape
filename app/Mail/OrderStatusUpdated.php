<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Pedido;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public $pedido;

    public function __construct(Pedido $pedido)
    {
        $this->pedido = (object) ['codigo' => $pedido->codigo, 'estado' => $pedido->estado,
            'tracking_number' => $pedido->tracking_number, 'courier_name' => $pedido->courier_name,
            'delivery_status' => $pedido->getAttribute('delivery_status'), 'pickup' => $pedido->getAttribute('pickup'),
            'usuario' => $pedido->usuario ? (object) ['nombres' => $pedido->usuario->nombres] : null];
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Actualización de Pedido #'.$this->pedido->codigo.' - NOVAPE',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order_status',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
