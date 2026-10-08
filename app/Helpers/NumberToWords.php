<?php

namespace App\Helpers;

use Luecano\NumeroALetras\NumeroALetras;

class NumberToWords
{
    public static function convert(float $amount): string
    {
        if (!class_exists(NumeroALetras::class)) {
            $cents = (int) round($amount * 100);
            $words = self::integer(intdiv($cents, 100));
            $words = preg_replace('/veintiuno$/u', 'veintiún', $words);
            $words = preg_replace('/uno$/u', 'un', $words);
            return mb_strtoupper($words.' con '.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT).'/100 soles');
        }

        $formatter = new NumeroALetras();
        $formatter->apocope = true;
        return preg_replace('/\bVEINTIUN\b/u', 'VEINTIÚN', $formatter->toInvoice($amount, 2, 'SOLES'));
    }

    private static function integer(int $value): string
    {
        $units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
        if ($value < 30) return $units[$value];
        if ($value < 100) {
            $tens = [3 => 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
            return $tens[intdiv($value, 10)].($value % 10 ? ' y '.$units[$value % 10] : '');
        }
        if ($value === 100) return 'cien';
        if ($value < 1000) {
            $hundreds = [1 => 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
            return $hundreds[intdiv($value, 100)].($value % 100 ? ' '.self::integer($value % 100) : '');
        }
        if ($value < 1000000) {
            $prefix = intdiv($value, 1000) === 1 ? 'mil' : preg_replace('/uno$/u', 'un', self::integer(intdiv($value, 1000))).' mil';
            return $prefix.($value % 1000 ? ' '.self::integer($value % 1000) : '');
        }
        $prefix = intdiv($value, 1000000) === 1 ? 'un millón' : preg_replace('/uno$/u', 'un', self::integer(intdiv($value, 1000000))).' millones';
        return $prefix.($value % 1000000 ? ' '.self::integer($value % 1000000) : '');
    }
}

