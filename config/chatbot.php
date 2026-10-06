<?php

return [
    'model' => env('CHATBOT_MODEL', 'gemini-2.5-flash'),
    'temperature' => 0.3,
    'max_output_tokens' => 1600,
    'instructions' => '',
    'fallback' => 'En este momento no puedo responder con la IA. Puedes solicitar atención de un asesor.',
    'semantic_search' => (bool) env('CHATBOT_SEMANTIC_SEARCH', false),
    'embedding_model' => env('CHATBOT_EMBEDDING_MODEL', 'gemini-embedding-001'),
];
