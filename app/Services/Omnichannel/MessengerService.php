<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MessengerService
{
    protected string $pageAccessToken;
    protected string $apiVersion;
    protected string $baseUrl;

    public function __construct()
    {
        $this->pageAccessToken = config('omnichannel.messenger.page_access_token', '');
        $this->apiVersion = config('omnichannel.messenger.api_version', 'v21.0');
        $this->baseUrl = "https://graph.facebook.com/{$this->apiVersion}/me/messages";
    }

    /**
     * Enviar un mensaje de texto por Messenger.
     */
    public function sendTextMessage(string $recipientId, string $message): array
    {
        return $this->sendRequest([
            'recipient' => ['id' => $recipientId],
            'messaging_type' => 'RESPONSE',
            'message' => ['text' => $message],
        ]);
    }

    /**
     * Enviar una imagen por Messenger.
     */
    public function sendImageMessage(string $recipientId, string $imageUrl): array
    {
        return $this->sendRequest([
            'recipient' => ['id' => $recipientId],
            'messaging_type' => 'RESPONSE',
            'message' => [
                'attachment' => [
                    'type' => 'image',
                    'payload' => ['url' => $imageUrl, 'is_reusable' => true],
                ],
            ],
        ]);
    }

    /**
     * Enviar un archivo/documento por Messenger.
     */
    public function sendFileMessage(string $recipientId, string $fileUrl): array
    {
        return $this->sendRequest([
            'recipient' => ['id' => $recipientId],
            'messaging_type' => 'RESPONSE',
            'message' => [
                'attachment' => [
                    'type' => 'file',
                    'payload' => ['url' => $fileUrl, 'is_reusable' => true],
                ],
            ],
        ]);
    }

    /**
     * Enviar la petición a la Graph API de Facebook.
     */
    protected function sendRequest(array $payload): array
    {
        try {
            $response = Http::withToken($this->pageAccessToken)
                ->timeout(30)
                ->post($this->baseUrl, $payload);

            $data = $response->json();

            if ($response->successful()) {
                Log::info('MESSENGER_MESSAGE_SENT', [
                    'recipient' => $payload['recipient']['id'] ?? 'unknown',
                    'message_id' => $data['message_id'] ?? null,
                ]);
                // Normalizar respuesta al mismo formato que WhatsApp
                return [
                    'success' => true,
                    'data' => [
                        'messages' => [['id' => $data['message_id'] ?? null]],
                    ],
                    'status_code' => $response->status(),
                ];
            }

            Log::error('MESSENGER_API_ERROR', [
                'status' => $response->status(),
                'response' => $data,
            ]);

            return [
                'success' => false,
                'data' => ['error' => $data['error']['message'] ?? 'Error en API de Messenger'],
                'status_code' => $response->status(),
            ];
        } catch (\Exception $e) {
            Log::error('MESSENGER_EXCEPTION', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'data' => ['error' => $e->getMessage()],
                'status_code' => 500,
            ];
        }
    }
}
