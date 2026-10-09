<?php

declare(strict_types=1);

namespace App\Services\Chatbot\Engine\Nodes;

use App\Services\Chatbot\ChatbotSettings;
use App\Services\Chatbot\Engine\EngineState;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgentNode
{
    public function __construct(private array $apiKeys, private string $systemPrompt, private array $toolsSchema) {}

    public function execute(EngineState $state): void
    {
        $settings = app(ChatbotSettings::class)->get();
        $payload = ['systemInstruction' => ['parts' => [['text' => $this->systemPrompt]]], 'contents' => $state->messages,
            'generationConfig' => ['temperature' => (float) $settings['temperature'], 'maxOutputTokens' => (int) $settings['max_output_tokens']]];
        if ($this->toolsSchema) {
            $payload['tools'] = [['functionDeclarations' => $this->toolsSchema]];
        }
        foreach ($this->apiKeys as $apiKey) {
            try {
                $response = Http::withOptions(['verify' => config('services.gemini.ca_bundle') ?: true])
                    ->withHeaders(['x-goog-api-key' => $apiKey])->connectTimeout(5)->timeout(25)
                    ->post('https://generativelanguage.googleapis.com/v1beta/models/'.$settings['model'].':generateContent', $payload);
                if (! $response->successful()) {
                    Log::warning('Chatbot: proveedor no disponible.', ['status' => $response->status()]);

                    continue;
                }
                $content = $response->json('candidates.0.content');
                $parts = $content['parts'] ?? [];
                $calls = array_values(array_filter(array_column($parts, 'functionCall')));
                if ($calls) {
                    $state->addMessage($content);
                    $state->pendingToolCalls = $calls;
                    $state->pendingToolCall = $calls[0];

                    return;
                }
                $text = implode("\n", array_map(fn ($part) => empty($part['thought']) ? ($part['text'] ?? '') : '', $parts));
                if (trim($text) !== '') {
                    $state->finalResponse = trim($text);
                } else {
                    $state->errorMessage = $settings['fallback'];
                }

                return;
            } catch (\Throwable $e) {
                Log::warning('Chatbot: error de conexion con el proveedor.', [
                    'type' => get_class($e),
                    'detail' => str_replace($this->apiKeys, '[redacted]', $e->getMessage()),
                ]);
            }
        }
        $state->errorMessage = $settings['fallback'];
    }
}
