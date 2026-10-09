<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Attachment;

class PedidoConfirmado extends Mailable
{
    use Queueable, SerializesModels;

    public $pedido;
    public $pdfContent;

    /**
     * Create a new message instance.
     *
     * @param array $pedido Datos del pedido
     * @param string $pdfContent Binario del PDF generado
     */
    public function __construct($pedido, $pdfContent)
    {
        $this->pedido = $pedido;
        $this->pdfContent = $pdfContent;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmación de tu Pedido #' . $this->pedido['codigo'],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.pedido_confirmado',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->pdfContent, 'comprobante-' . $this->pedido['codigo'] . '.pdf')
                    ->withMime('application/pdf'),
        ];
    }
}
