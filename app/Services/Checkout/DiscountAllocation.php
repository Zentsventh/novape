<?php
declare(strict_types=1);
namespace App\Services\Checkout;

final class DiscountAllocation
{
    /** Allocate whole cents, with deterministic largest remainders and no negative net line. */
    public static function cents(array $gross, float $discount): array
    {
        $weights = array_map(fn($amount)=>(int)round($amount*100),$gross);
        $sum = array_sum($weights);
        $target = min($sum,max(0,(int)round($discount*100)));
        $result = array_fill(0,count($weights),0); $remainders = [];
        if ($sum <= 0) return $result;
        foreach ($weights as $index=>$weight) {
            $result[$index] = intdiv($target*$weight,$sum);
            $remainders[$index] = ($target*$weight)%$sum;
        }
        arsort($remainders,SORT_NUMERIC);
        $remaining = $target-array_sum($result);
        foreach ($remainders as $index=>$remainder) { if ($remaining-- <= 0) break; $result[$index]++; }
        return $result;
    }
}
