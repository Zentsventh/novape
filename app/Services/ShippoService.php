<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippoService
{
    private string $baseUrl = 'https://api.goshippo.com';

    public function isConfigured(): bool
    {
        $key = (string) config('services.shippo.key');
        return $key !== '' && $key !== 'shippo_test_...';
    }

    private function client()
    {
        return Http::connectTimeout(4)->timeout(12)->withoutVerifying()->withHeaders([
            'Authorization' => 'ShippoToken '.config('services.shippo.key'),
            'SHIPPO-API-VERSION' => '2018-02-08',
        ])->acceptJson();
    }

    public function quote(array $origin, array $destination, array $parcels): ?array
    {
        if (! $this->isConfigured() || ! $parcels) return null;
        if (config('services.niubiz.env') === 'production' && str_starts_with((string) config('services.shippo.key'), 'shippo_test_')) return null;
        foreach ([$origin, $destination] as $address) {
            if (empty($address['street1']) || empty($address['city']) || ($address['country'] ?? null) !== 'PE') return null;
        }
        $payload = ['address_from' => array_filter($origin, fn ($v) => $v !== null && $v !== ''),
            'address_to' => array_filter($destination, fn ($v) => $v !== null && $v !== ''), 'parcels' => $parcels, 'async' => false];
        if ($accounts = config('services.shippo.carrier_accounts')) $payload['carrier_accounts'] = $accounts;
        $key = 'shippo:quote:'.hash('sha256', json_encode([$payload, config('services.shippo.key')]));
        if ($cached = Cache::get($key)) return isset($cached['unavailable']) ? null : $cached;
        try {
            $response = $this->client()->post($this->baseUrl.'/shipments/', $payload);
            if (! $response->successful()) {
                Log::warning('Shippo quotation unavailable', ['http_status' => $response->status()]);
                Cache::put($key, ['unavailable' => true], now()->addMinute());
                return null;
            }
            $rates = $response->json('rates', []);
            $test = str_starts_with((string) config('services.shippo.key'), 'shippo_test_');
            $eligible = [];
            foreach (is_array($rates) ? $rates : [] as $rate) {
                // Never interpret USD/EUR as soles or use a test rate with a live key.
                if (! $test && ($rate['test'] ?? false)) continue;
                $amount = ($rate['currency'] ?? '') === 'PEN' ? ($rate['amount'] ?? null)
                    : (($rate['currency_local'] ?? '') === 'PEN' ? ($rate['amount_local'] ?? null) : null);
                if (! is_numeric($amount) || ! is_finite((float) $amount) || (float) $amount <= 0 || empty($rate['object_id'])) continue;
                $eligible[] = ['costo' => round((float) $amount, 2), 'currency' => 'PEN', 'courier' => $rate['provider'] ?? 'Transportista',
                    'rate_id' => $rate['object_id'], 'service' => $rate['servicelevel']['name'] ?? '', 'estimated_days' => $rate['estimated_days'] ?? null,
                    'source' => 'shippo', 'test' => $test || (bool) ($rate['test'] ?? false)];
            }
            usort($eligible, fn ($a, $b) => $a['costo'] <=> $b['costo']);
            if (! $eligible) {
                if ($test) {
                    $eligible[] = ['costo' => 15.00, 'currency' => 'PEN', 'courier' => 'DHL Express',
                        'rate_id' => 'mock_rate_' . uniqid(), 'service' => 'Express Delivery', 'estimated_days' => 1,
                        'source' => 'shippo', 'test' => true];
                } else {
                    Cache::put($key, ['unavailable' => true], now()->addMinute());
                    return null;
                }
            }
            Cache::put($key, $eligible[0], now()->addMinutes(5));
            return $eligible[0];
        } catch (\Throwable $error) {
            Log::warning('Shippo quotation connection failed', ['exception' => get_class($error)]);
            Cache::put($key, ['unavailable' => true], now()->addMinute());
            return null;
        }
    }

    public function trackPackage($carrier, $trackingNumber)
    {
        if (! $this->isConfigured()) return null;
        try {
            $response = $this->client()->get($this->baseUrl.'/tracks/'.rawurlencode($carrier).'/'.rawurlencode($trackingNumber));
            return $response->successful() ? $response->json() : null;
        } catch (\Throwable $error) {
            Log::warning('Shippo tracking unavailable', ['exception' => get_class($error)]);
            return null;
        }
    }
}
