<?php

return [
    // Large admin responses should not be duplicated by the development recorder.
    // Enable explicitly when investigating an Inertia request locally.
    'devtools' => [
        'enabled' => env('INERTIA_DEVTOOLS_ENABLED', false),
        'except' => ['telescope*', 'horizon*', '_inertia/devtools*'],
        'storage' => [
            'path' => storage_path('inertia-devtools'),
            'ttl' => 24,
            'prune_interval' => 300,
            'limit' => 100,
        ],
        'middleware' => ['web'],
        'gate' => env('INERTIA_DEVTOOLS_GATE'),
        'redact' => ['keys' => ['password', 'password_hash', 'password_confirmation', 'token', '_token', 'access_token', 'secret', 'whatsapp_token', 'whatsapp_app_secret']],
    ],
];
