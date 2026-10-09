<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\Pedido;

class OrderCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $pedido;
    public $pdfContent;

    public function __construct(Pedido $pedido, $pdfContent = null)
    {
        $this->pedido = $pedido;
        $this->pdfContent = $pdfContent;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmación de Pedido #' . $this->pedido->codigo . ' - NOVAPE',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order_created',
        );
    }

    public function attachments(): array
    {
        if ($this->pdfContent) {
            return [
                \Illuminate\Mail\Mailables\Attachment::fromData(fn () => $this->pdfContent, 'Factura-' . $this->pedido->codigo . '.pdf')
                    ->withMime('application/pdf'),
            ];
        }
        return [];
    }
}
