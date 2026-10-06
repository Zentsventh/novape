<?php

namespace App\Helpers;

use Luecano\NumeroALetras\NumeroALetras;

class NumberToWords
{
    public static function convert(float $amount): string
    {
        if (!class_exists(NumeroALetras::class)) {
            return '---';
        }

        $formatter = new NumeroALetras();
        return $formatter->toInvoice($amount, 2, 'SOLES');
    }
}

