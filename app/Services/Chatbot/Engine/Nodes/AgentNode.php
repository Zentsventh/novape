<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Engine\Nodes;

use App\Services\Chatbot\Engine\EngineState;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgentNode
{
    private string $apiKey;
    private string $systemPrompt;
    private array $toolsSchema;

    public function __construct(string $apiKey, string $systemPrompt, array $toolsSchema)
    {
        $this->apiKey = $apiKey;
        $this->systemPrompt = $systemPrompt;
        $this->toolsSchema = $toolsSchema;
    }

    public function execute(EngineState $state): void
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->apiKey}";
        
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

        try {
            $response = Http::withoutVerifying()
                ->withHeaders(['Content-Type' => 'application/json'])
                ->timeout(20)
                ->post($url, $payload);
            
            if (!$response->successful()) {
                Log::error('Error de Gemini API: ' . $response->body());
                $state->errorMessage = 'Error al comunicarse con la IA.';
                return;
            }

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

        } catch (\Exception $e) {
            Log::error('Error en el AgentNode: ' . $e->getMessage());
            $state->errorMessage = 'No hay conexión con el servidor de inteligencia artificial.';
        }
    }
}
