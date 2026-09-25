<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WhatsApp Cloud API (Meta)
    |--------------------------------------------------------------------------
    */
    'whatsapp' => [
        'token' => env('WHATSAPP_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
        'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
        'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
        'app_secret' => env('WHATSAPP_APP_SECRET', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Gemini AI (Google)
    |--------------------------------------------------------------------------
    */
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'api_key_secondary' => env('GEMINI_API_KEY_SECONDARY'),
        'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/models/'),
        'model' => env('GEMINI_MODEL', 'gemini-flash-latest'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Messenger (Facebook)
    |--------------------------------------------------------------------------
    */
    'messenger' => [
        'page_access_token' => env('MESSENGER_PAGE_ACCESS_TOKEN'),
        'page_id' => env('MESSENGER_PAGE_ID'),
        'verify_token' => env('MESSENGER_VERIFY_TOKEN'),
        'app_secret' => env('MESSENGER_APP_SECRET', ''),
        'api_version' => env('MESSENGER_API_VERSION', 'v21.0'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Instagram
    |--------------------------------------------------------------------------
    */
    'instagram' => [
        'access_token' => env('INSTAGRAM_ACCESS_TOKEN'),
        'account_id' => env('INSTAGRAM_ACCOUNT_ID'),
        'verify_token' => env('INSTAGRAM_VERIFY_TOKEN'),
        'app_secret' => env('INSTAGRAM_APP_SECRET', ''),
        'api_version' => env('INSTAGRAM_API_VERSION', 'v21.0'),
    ],
];
