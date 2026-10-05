<?php

return [
    'company' => [
        'razon_social' => env('INVOICE_COMPANY_NAME', 'NOVAPE'),
        'ruc' => env('INVOICE_COMPANY_RUC', 'No configurado'),
        'direccion' => env('INVOICE_COMPANY_ADDRESS', 'No configurada'),
        'telefono' => env('INVOICE_COMPANY_PHONE', ''),
        'email' => env('INVOICE_COMPANY_EMAIL', ''),
        'horario' => env('INVOICE_COMPANY_HOURS', ''),
    ],
];
