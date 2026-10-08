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
        'maps_key' => env('GOOGLE_MAPS_BROWSER_KEY'),
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'niubiz' => [
        'user' => env('NIUBIZ_USER'),
        'password' => env('NIUBIZ_PASSWORD'),
        'merchant_id' => env('NIUBIZ_MERCHANT_ID'),
        'env' => env('NIUBIZ_ENV', 'sandbox'),
        // Public sandbox fixture: Niubiz integration manual, section 6.1.
        'test_card' => [
            'brand' => 'Visa',
            'number' => '4551708161768059',
            'expiry' => '03/28',
            'cvv' => '111',
            'source' => 'https://s3-gestor-librerias.s3.amazonaws.com/Plugins/WooCommerce/Manual_Integracion_WooCommerce_v2.0.pdf',
        ],
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
        'origin' => [
            'name' => env('SHIPPO_ORIGIN_NAME', 'Novape'),
            'street1' => env('SHIPPO_ORIGIN_STREET'),
            'city' => env('SHIPPO_ORIGIN_CITY', 'Lima'),
            'state' => env('SHIPPO_ORIGIN_STATE', 'LMA'),
            'zip' => env('SHIPPO_ORIGIN_ZIP'),
            'country' => 'PE',
            'phone' => env('SHIPPO_ORIGIN_PHONE'),
            'email' => env('SHIPPO_ORIGIN_EMAIL'),
        ],
        'carrier_accounts' => array_values(array_filter(array_map('trim', explode(',', env('SHIPPO_CARRIER_ACCOUNTS', ''))))),
    ],
    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'secondary_key' => env('GEMINI_API_KEY_SECONDARY'),
        'ca_bundle' => env('GEMINI_CA_BUNDLE'),
    ],
];
