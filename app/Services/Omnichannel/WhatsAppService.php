<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use App\Models\ConfiguracionSitio;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected string $token;

    protected string $phoneNumberId;

    protected string $apiVersion;

    protected string $baseUrl;

    public function __construct()
    {
        $this->token = (string) ConfiguracionSitio::obtener('whatsapp_token', config('omnichannel.whatsapp.token'));
        $this->phoneNumberId = (string) ConfiguracionSitio::obtener('whatsapp_phone_number_id', config('omnichannel.whatsapp.phone_number_id'));
        $this->apiVersion = config('omnichannel.whatsapp.api_version', 'v21.0');
        $this->baseUrl = "https://graph.facebook.com/{$this->apiVersion}";
    }

    public function sendTextMessage(string $to, string $message, bool $previewUrl = false): array
    {
        return $this->sendRequest([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'text',
            'text' => ['preview_url' => $previewUrl, 'body' => $message],
        ]);
    }

    public function sendImageMessage(string $to, string $imageUrl, ?string $caption = null): array
    {
        $image = ['link' => $imageUrl];
        if ($caption) {
            $image['caption'] = $caption;
        }

        return $this->sendRequest([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'image',
            'image' => $image,
        ]);
    }

    public function sendDocumentMessage(string $to, string $documentUrl, ?string $caption = null, ?string $filename = null): array
    {
        $document = ['link' => $documentUrl];
        if ($caption) {
            $document['caption'] = $caption;
        }
        if ($filename) {
            $document['filename'] = $filename;
        }

        return $this->sendRequest([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'document',
            'document' => $document,
        ]);
    }

    public function sendTemplateMessage(string $to, string $templateName, string $languageCode = 'es', array $components = []): array
    {
        $template = ['name' => $templateName, 'language' => ['code' => $languageCode]];
        if (! empty($components)) {
            $template['components'] = $components;
        }

        return $this->sendRequest([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $to,
            'type' => 'template',
            'template' => $template,
        ]);
    }

    public function markAsRead(string $messageId): array
    {
        return $this->sendRequest([
            'messaging_product' => 'whatsapp',
            'status' => 'read',
            'message_id' => $messageId,
        ]);
    }

    public function getMediaUrl(string $mediaId): ?string
    {
        try {
            $response = Http::withToken($this->token)->get("{$this->baseUrl}/{$mediaId}");
            if ($response->successful()) {
                return $response->json('url');
            }
            Log::error('WHATSAPP_MEDIA_ERROR', ['media_id' => $mediaId, 'response' => $response->json()]);

            return null;
        } catch (\Exception $e) {
            Log::error('WHATSAPP_MEDIA_EXCEPTION', ['media_id' => $mediaId, 'error' => $e->getMessage()]);

            return null;
        }
    }

    protected function sendRequest(array $payload): array
    {
        $url = "{$this->baseUrl}/{$this->phoneNumberId}/messages";
        try {
            $response = Http::withOptions([])->withToken($this->token)->timeout(30)->post($url, $payload);
            $data = $response->json();

            if ($response->successful()) {
                Log::info('WHATSAPP_MESSAGE_SENT', [
                    'to' => $payload['to'] ?? 'unknown',
                    'type' => $payload['type'] ?? 'unknown',
                    'message_id' => $data['messages'][0]['id'] ?? null,
                ]);
            } else {
                Log::error('WHATSAPP_API_ERROR', ['status' => $response->status(), 'response' => $data]);
            }

            return ['success' => $response->successful(), 'data' => $data, 'status_code' => $response->status()];
        } catch (\Exception $e) {
            Log::error('WHATSAPP_EXCEPTION', ['error' => $e->getMessage()]);

            return ['success' => false, 'data' => ['error' => $e->getMessage()], 'status_code' => 500];
        }
    }
}
