<?php

declare(strict_types=1);

namespace App\Services\User;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Mail\Mailable as MailableContract;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificarCelularMail extends Mailable implements MailableContract
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $codigo,
        public string $celular
    ) {}

    public function build(): self
    {
        return $this->subject('Código de verificación')
                    ->view('emails.verificar_celular')
                    ->with([
                        'codigo' => $this->codigo,
                        'celular' => $this->celular,
                    ]);
    }
}
