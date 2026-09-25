<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Engine\Nodes;

use App\Services\Chatbot\Engine\EngineState;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgentNode
{
    private array $apiKeys;
    private string $systemPrompt;
    private array $toolsSchema;

    public function __construct(array $apiKeys, string $systemPrompt, array $toolsSchema)
    {
        $this->apiKeys = $apiKeys;
        $this->systemPrompt = $systemPrompt;
        $this->toolsSchema = $toolsSchema;
    }

    public function execute(EngineState $state): void
    {
        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $this->systemPrompt]]
            ],
            'contents' => $state->messages,
            'tools' => [['functionDeclarations' => $this->toolsSchema]],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 800,
            ]
        ];

        $keysToTry = $this->apiKeys;
        shuffle($keysToTry);

        $lastError = null;

        foreach ($keysToTry as $apiKey) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}";
            
            try {
                // Usamos un timeout más corto (12s) para que pueda rotar a la otra llave rápidamente si hay problemas
                $response = Http::withoutVerifying()
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(12)
                    ->post($url, $payload);
                
                if ($response->successful()) {
                    $data = $response->json();
                    $responsePart = $data['candidates'][0]['content']['parts'][0] ?? null;
                    
                    if (!$responsePart) {
                        $state->errorMessage = 'Lo siento, hubo un problema al generar la respuesta.';
                        return;
                    }

                    if (isset($responsePart['functionCall'])) {
                        // LLM quiere ejecutar una tool
                        $state->pendingToolCall = $responsePart['functionCall'];
                        
                        // Actualizar historial con la petición de la función del modelo
                        $state->addMessage([
                            'role' => 'model',
                            'parts' => [
                                ['functionCall' => $responsePart['functionCall']]
                            ]
                        ]);
                    } elseif (isset($responsePart['text'])) {
                        // LLM devolvió texto final
                        $state->finalResponse = $responsePart['text'];
                    } else {
                        $state->errorMessage = 'Respuesta inesperada del modelo de IA.';
                    }

                    // Éxito, salir del loop
                    return;
                } else {
                    $lastError = 'API Error: ' . $response->body();
                    Log::warning('AgentNode - Intento fallido con una API key. Probando otra...', ['error' => $response->body()]);
                    continue; // Probar siguiente llave
                }

            } catch (\Exception $e) {
                $lastError = $e->getMessage();
                Log::warning('AgentNode - Timeout o error de red con una API key. Probando otra...', ['error' => $lastError]);
                continue; // Probar siguiente llave
            }
        }

        // Si el loop termina y no hubo "return", significa que todas las llaves fallaron.
        Log::error('AgentNode - Todas las API keys fallaron. Último error: ' . $lastError);
        $state->errorMessage = 'No hay conexión con el servidor de inteligencia artificial.';
    }
}
