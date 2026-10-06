<?php

namespace App\Services\Chatbot;

use Illuminate\Support\Facades\Http;

class EmbeddingService
{
    public function embed(string $text, bool $query = false, string $title = ''): array
    {
        $key = config('services.gemini.key') ?: config('services.gemini.secondary_key');
        if (! $key) {
            throw new \RuntimeException('Configura GEMINI_API_KEY para indexar por significado.');
        }
        $model = config('chatbot.embedding_model');
        $payload = ['model' => 'models/'.$model, 'content' => ['parts' => [['text' => $text]]],
            'taskType' => $query ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT', 'outputDimensionality' => 768];
        if (! $query) {
            $payload['title'] = $title;
        }
        $response = Http::withOptions(['verify' => config('services.gemini.ca_bundle') ?: true])
            ->withHeaders(['x-goog-api-key' => $key])->connectTimeout(5)->timeout(20)
            ->post('https://generativelanguage.googleapis.com/v1beta/models/'.$model.':embedContent', $payload);
        if (! $response->successful()) {
            throw new \RuntimeException('No se pudo generar el índice semántico (HTTP '.$response->status().').');
        }
        $values = $response->json('embedding.values');
        if (! is_array($values) || count($values) !== 768 || count(array_filter($values, 'is_numeric')) !== 768) {
            throw new \RuntimeException('El proveedor devolvió un vector inválido.');
        }

        return $values;
    }

    public function similarity(array $a, array $b): float
    {
        if (count($a) !== count($b)) {
            return 0;
        }
        $dot = $aa = $bb = 0.0;
        foreach ($a as $i => $value) {
            $dot += $value * $b[$i];
            $aa += $value ** 2;
            $bb += $b[$i] ** 2;
        }

        return $aa > 0 && $bb > 0 ? $dot / sqrt($aa * $bb) : 0;
    }
}
