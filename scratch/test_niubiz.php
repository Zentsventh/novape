<?php
$ch = curl_init('https://apitestenv.vnforapps.com/api.security/v1/security');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . base64_encode('integraciones@niubiz.com.pe:_7z3@8fF')]);
$res = curl_exec($ch);
if(curl_error($ch)) {
    echo "ERROR: " . curl_error($ch);
} else {
    echo $res;
}
