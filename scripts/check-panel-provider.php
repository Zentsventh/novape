<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (! $app->environment('local')) throw new RuntimeException('Local diagnostic only.');
if (isset($argv[1]) && preg_match('/^gemini-[a-z0-9.-]+$/', $argv[1])) config(['panel_assistant.model' => $argv[1]]);
foreach (['primary' => config('panel_assistant.api_key'), 'secondary' => config('omnichannel.gemini.api_key_secondary')] as $name => $key) {
    if (! $key) { echo "$name: not configured\n"; continue; }
    try {
        if (($argv[1] ?? '') === '--models') {
            $r = Illuminate\Support\Facades\Http::connectTimeout(3)->timeout(10)->withHeaders(['x-goog-api-key' => $key])->get('https://generativelanguage.googleapis.com/v1beta/models');
            echo $name.': models HTTP '.$r->status()."\n";
            if ($r->successful()) {
                foreach ($r->json('models', []) as $model) {
                    if (str_contains($model['name'], 'flash') && in_array('generateContent', $model['supportedGenerationMethods'] ?? [], true)) echo $model['name']."\n";
                }
                exit;
            }
            continue;
        }
        $r = Illuminate\Support\Facades\Http::connectTimeout(3)->timeout(10)->withHeaders(['x-goog-api-key' => $key])->post('https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode(config('panel_assistant.model')).':generateContent', ['contents' => [['parts' => [['text' => 'Responde únicamente: Listo.']]]], 'generationConfig' => ['maxOutputTokens' => 30]]);
        echo $name.': HTTP '.$r->status().' status='.($r->json('error.status') ?? 'OK').' reason='.($r->json('error.details.0.reason') ?? 'unspecified').' text='.(is_string($r->json('candidates.0.content.parts.0.text')) ? 'yes' : 'no')."\n";
    } catch (Throwable $e) { echo $name.': '.get_class($e)."\n"; }
}
