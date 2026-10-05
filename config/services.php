<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'niubiz' => [
        'user' => env('NIUBIZ_USER'),
        'password' => env('NIUBIZ_PASSWORD'),
        'merchant_id' => env('NIUBIZ_MERCHANT_ID'),
        'env' => env('NIUBIZ_ENV', 'sandbox'),
    ],
    'apiperu' => [
        'url' => env('API_PERU_URL'),
        'document_url' => env('API_PERU_DOCUMENT_URL', 'https://apiperu.dev/api'),
        'token' => env('API_PERU_TOKEN'),
    ],
    'enrichment' => [
        'url' => env('CRM_ENRICHMENT_URL'),
        'token' => env('CRM_ENRICHMENT_TOKEN'),
    ],
    'openwa' => [
        'url' => env('OPENWA_API_URL', 'http://localhost:2785'),
        'key' => env('OPENWA_API_KEY', ''),
        'session' => env('OPENWA_SESSION_NAME', 'default'),
    ],
    'fedex' => [
        'url' => env('FEDEX_BASE_URL', 'https://apis-sandbox.fedex.com'),
        'client_id' => env('FEDEX_CLIENT_ID', 'sandbox_client_id'),
        'client_secret' => env('FEDEX_CLIENT_SECRET', 'sandbox_client_secret'),
        'account' => env('FEDEX_ACCOUNT_NUMBER', 'sandbox_account'),
    ],
    'shippo' => [
        'key' => env('SHIPPO_API_KEY'),
    ],
    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'secondary_key' => env('GEMINI_API_KEY_SECONDARY'),
    ],
];
