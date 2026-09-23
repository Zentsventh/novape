<?php
$user = 'integraciones@niubiz.com.pe';
$password = '_7z3@8fF';
$merchantId = '456879852';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://apitestenv.vnforapps.com/api.security/v1/security");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERPWD, "$user:$password");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$token = curl_exec($ch);
curl_close($ch);

echo "Token length: " . strlen($token) . "\n";

$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, "https://apitestenv.vnforapps.com/api.ecommerce/v2/ecommerce/token/session/$merchantId");
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode([
    "channel" => "web", 
    "amount" => 10.50, 
    "antifraud" => [
        "clientIp" => "127.0.0.1",
        "merchantDefineData" => [
            "MDD4" => "test@test.com",
            "MDD32" => "DNI",
            "MDD75" => "Invitado",
            "MDD77" => "1"
        ]
    ]
]));
curl_setopt($ch2, CURLOPT_HTTPHEADER, [
    "Authorization: $token", 
    "Content-Type: application/json"
]);
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
$res2 = curl_exec($ch2);
$httpCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "Response Code: $httpCode\n";
echo "Response: $res2\n";
