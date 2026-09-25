<?php

declare(strict_types=1);

namespace App\Services\Omnichannel;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiChatService
{
    protected array $apiKeys;
    protected string $baseUrl;

    public function __construct()
    {
        $key1 = config('omnichannel.gemini.api_key', '');
        $key2 = config('omnichannel.gemini.api_key_secondary', '');
        
        // Remove empty keys from the list
        $this->apiKeys = array_values(array_filter([$key1, $key2]));
        
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
        
        $keysToTry = $this->apiKeys;
        
        if (empty($keysToTry)) {
            Log::error('Gemini API Error - No hay API Keys configuradas.');
            return [
                'type' => 'error',
                'data' => 'Error de configuración: No hay claves API disponibles.',
                'tokens' => 0,
                'duration_ms' => 0,
            ];
        }

        // Algoritmo experto de balanceo y resiliencia: 
        // 1. Mezclamos aleatoriamente las llaves (Load Balancing).
        // 2. Si una llave falla (ej. Rate Limit o 500), intentamos con la siguiente (Failover).
        Log::info('GeminiChatService - API keys to try', ['keys' => array_map(function($k){return substr($k,0,4)."***".substr($k,-4);}, $keysToTry)]);
        shuffle($keysToTry);
        
        $lastDurationMs = 0;

        foreach ($keysToTry as $index => $apiKey) {
            $url = $this->baseUrl . $model . ':generateContent?key=' . $apiKey;
            $maskedKey = substr($apiKey, 0, 4) . '***' . substr($apiKey, -4);

            try {
                $startTime = microtime(true);
                // Tiempo de espera para que no se congele si la API no responde
                $response = Http::timeout(15)->post($url, $payload);
                $lastDurationMs = (int) round((microtime(true) - $startTime) * 1000);

                if ($response->successful()) {
                    $data = $response->json();

                    // Function call (transferencia a humano)
                    if (isset($data['candidates'][0]['content']['parts'][0]['functionCall'])) {
                        return [
                            'type' => 'functionCall',
                            'data' => $data['candidates'][0]['content']['parts'][0]['functionCall'],
                            'tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
                            'duration_ms' => $lastDurationMs,
                        ];
                    }

                    // Respuesta de texto
                    if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
                        return [
                            'type' => 'text',
                            'data' => $data['candidates'][0]['content']['parts'][0]['text'],
                            'tokens' => $data['usageMetadata']['totalTokenCount'] ?? 0,
                            'duration_ms' => $lastDurationMs,
                        ];
                    }
                }

                Log::warning("Gemini API Warning (Key: {$maskedKey})", ['status' => $response->status(), 'body' => $response->body()]);
                
                // Si la respuesta fue un 400 (Bad Request), probablemente el payload esté mal y no servirá intentar con otra llave
                if ($response->status() === 400) {
                    break;
                }
                // Si la respuesta contiene un mensaje de error en JSON, lo registramos para diagnóstico
                if ($response->json('error.message')) {
                    Log::error('Gemini API error message', ['message' => $response->json('error.message'), 'key' => $maskedKey]);
                }
                // Si no, continuamos con la siguiente llave en el loop...
            } catch (\Exception $e) {
                Log::warning("Gemini API Exception (Key: {$maskedKey})", ['message' => $e->getMessage()]);
                // Continuamos con la siguiente llave...
            }
        }

        Log::error('Gemini API Error - Todas las API Keys fallaron');
        return [
            'type' => 'error',
            'data' => 'Lo siento, en este momento estoy teniendo problemas de conexión. Por favor intenta más tarde.',
            'tokens' => 0,
            'duration_ms' => $lastDurationMs,
        ];
    }
}
