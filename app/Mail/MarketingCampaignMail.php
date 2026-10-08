<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\MarketingCampaign;
use App\Models\Usuario;
use Illuminate\Support\HtmlString;

class MarketingCampaignMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public MarketingCampaign $campaign,
        public Usuario $user
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->campaign->subject ?? $this->campaign->name,
        );
    }

    public function content(): Content
    {
        $contentHtml = $this->campaign->content;
        
        // Simple placeholder replacement
        $contentHtml = str_replace('{{ nombre }}', e($this->user->nombres), $contentHtml);
        $contentHtml = str_replace('{{ apellido }}', e($this->user->apellidos), $contentHtml);

        return new Content(
            view: 'emails.marketing.campaign',
            with: [
                'contentHtml' => new HtmlString($contentHtml),
                'user' => $this->user
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
