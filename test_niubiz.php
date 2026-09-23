<?php
require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\Http;

$user = 'integraciones@niubiz.com.pe';
$password = '_7z3@8fF';
$merchantId = '456879852';
$baseUrl = 'https://apitestenv.vnforapps.com';

try {
    // 1. Get Token
    $response = Http::withBasicAuth($user, $password)
        ->withOptions(['verify' => false])
        ->get("$baseUrl/api.security/v1/security");
    $token = $response->body();
    echo "TOKEN: " . substr($token, 0, 10) . "...\n";

    // 2. Create Session
    $amount = 10.50;
    $response = Http::withHeaders(['Authorization' => $token])
        ->withOptions(['verify' => false])
        ->post("$baseUrl/api.ecommerce/v2/ecommerce/token/session/$merchantId", [
            'channel' => 'web',
            'amount' => $amount,
            'antifraud' => [
                'clientIp' => '127.0.0.1',
                'merchantDefineData' => [
                    'MDD4' => 'test@test.com',
                    'MDD32' => 'DNI',
                    'MDD75' => 'Invitado',
                    'MDD77' => '1'
                ]
            ]
        ]);
    $sessionKey = $response->json()['sessionKey'];
    echo "SESSION: " . substr($sessionKey, 0, 10) . "...\n";
    
    echo "\n\nCrea un token de transaccion usando la UI o saltamos al paso 3?\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
