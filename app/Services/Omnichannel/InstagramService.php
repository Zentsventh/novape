<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class InstagramService
{
    protected string $accessToken;
    protected string $accountId;
    protected string $apiVersion;
    protected string $baseUrl;

    public function __construct()
    {
        $this->accessToken = config('omnichannel.instagram.access_token', '');
        $this->accountId = config('omnichannel.instagram.account_id', '');
        $this->apiVersion = config('omnichannel.instagram.api_version', 'v21.0');
        $this->baseUrl = "https://graph.facebook.com/{$this->apiVersion}/me/messages";
    }

    /**
     * Enviar un mensaje de texto por Instagram DM.
     */
    public function sendTextMessage(string $recipientId, string $message): array
    {
        return $this->sendRequest([
            'recipient' => ['id' => $recipientId],
            'message' => ['text' => $message],
        ]);
    }

    /**
     * Enviar una imagen por Instagram DM.
     */
    public function sendImageMessage(string $recipientId, string $imageUrl): array
    {
        return $this->sendRequest([
            'recipient' => ['id' => $recipientId],
            'message' => [
                'attachment' => [
                    'type' => 'image',
                    'payload' => ['url' => $imageUrl],
                ],
            ],
        ]);
    }

    /**
     * Enviar la petición a la Graph API de Instagram.
     */
    protected function sendRequest(array $payload): array
    {
        try {
            $response = Http::withToken($this->accessToken)
                ->timeout(30)
                ->post($this->baseUrl, $payload);

            $data = $response->json();

            if ($response->successful()) {
                Log::info('INSTAGRAM_MESSAGE_SENT', [
                    'recipient' => $payload['recipient']['id'] ?? 'unknown',
                    'message_id' => $data['message_id'] ?? null,
                ]);
                // Normalizar respuesta al mismo formato
                return [
                    'success' => true,
                    'data' => [
                        'messages' => [['id' => $data['message_id'] ?? null]],
                    ],
                    'status_code' => $response->status(),
                ];
            }

            Log::error('INSTAGRAM_API_ERROR', [
                'status' => $response->status(),
                'response' => $data,
            ]);

            return [
                'success' => false,
                'data' => ['error' => $data['error']['message'] ?? 'Error en API de Instagram'],
                'status_code' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('INSTAGRAM_EXCEPTION', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'data' => ['error' => $e->getMessage()],
                'status_code' => 500,
            ];
        }
    }
}
