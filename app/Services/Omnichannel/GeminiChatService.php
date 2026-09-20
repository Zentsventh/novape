<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiChatService
{
    protected string $apiKey;
    protected string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('omnichannel.gemini.api_key', '');
        $this->baseUrl = config('omnichannel.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta/models/');
    }

    /**
     * Genera una respuesta con Gemini Flash, incluyendo function calling para transferencia a humano.
     *
     * SIEMPRE retorna un array con claves: type, data, tokens, duration_ms
     *  - type: 'text' | 'functionCall' | 'error'
     *  - data: string (texto) | array (function call data) | string (mensaje de error)
     *  - tokens: int
     *  - duration_ms: int
     */
    public function generateResponse(string $systemPrompt, array $history, string $newMessage, float $temperature = 0.7): array
    {
        $contents = [];

        foreach ($history as $msg) {
            $role = $msg['is_ai'] ? 'model' : 'user';
            $contents[] = ['role' => $role, 'parts' => [['text' => $msg['content']]]];
        }

        $contents[] = ['role' => 'user', 'parts' => [['text' => $newMessage]]];

        $payload = [
            'system_instruction' => ['parts' => ['text' => $systemPrompt]],
            'contents' => $contents,
            'tools' => [[
                'functionDeclarations' => [[
                    'name' => 'transferir_a_humano',
                    'description' => 'Transfiere la conversación a un agente humano. Usa esta función SOLAMENTE si el usuario está muy enojado, frustrado, o pide explícitamente hablar con un humano o un asesor.',
                    'parameters' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'reason' => [
                                'type' => 'STRING',
                                'description' => 'El motivo por el cual se transfiere a un humano.'
                            ]
                        ],
                        'required' => ['reason']
                    ]
                ]]
            ]],
            'generationConfig' => ['temperature' => $temperature],
        ];

        $model = config('omnichannel.gemini.model', 'gemini-flash-latest');
        $url = $this->baseUrl . $model . ':generateContent?key=' . $this->apiKey;

        try {
            $startTime = microtime(true);
            $response = Http::timeout(30)->post($url, $payload);
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);

            if ($response->successful()) {
                $data = $response->json();

                // Function call (transferencia a humano)
                if (isset($data['candidates'][0]['content']['parts'][0]['functionCall'])) {
                    return [
                        'type' => 'functionCall',
                        'data' => $data['candidates'][0]['content']['parts'][0]['functionCall'],
                        'tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
                        'duration_ms' => $durationMs,
                    ];
                }

                // Respuesta de texto
                if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                    return [
                        'type' => 'text',
                        'data' => $data['candidates'][0]['content']['parts'][0]['text'],
                        'tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
                        'duration_ms' => $durationMs,
                    ];
                }
            }

            Log::error('Gemini API Error', ['status' => $response->status(), 'body' => $response->body()]);
            return [
                'type' => 'error',
                'data' => 'Lo siento, en este momento estoy teniendo problemas. Por favor intenta más tarde.',
                'tokens' => 0,
                'duration_ms' => $durationMs,
            ];
        } catch (\Exception $e) {
            Log::error('Gemini API Exception', ['message' => $e->getMessage()]);
            return [
                'type' => 'error',
                'data' => 'Lo siento, el asistente no está disponible en este momento.',
                'tokens' => 0,
                'duration_ms' => 0,
            ];
        }
    }
}
