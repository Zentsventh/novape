<?php

return [
    // Independent prompt and history; the panel can override the existing provider credential.
    'api_key' => env('PANEL_ASSISTANT_GEMINI_API_KEY', env('GEMINI_API_KEY', '')),
    'api_key_secondary' => env('PANEL_ASSISTANT_GEMINI_API_KEY_SECONDARY', env('GEMINI_API_KEY_SECONDARY', '')),
    'model' => env('PANEL_ASSISTANT_GEMINI_MODEL', 'gemini-3.8-flash'),
];
