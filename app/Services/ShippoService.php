<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShippoService
{
    protected $baseUrl = 'https://api.goshippo.com';

    protected $apiToken;

    public function __construct()
    {
        $this->apiToken = config('services.shippo.key');
    }

    /**
     * Cotiza el precio de envío basado en el peso usando Shippo.
     */
    public function getShippingRate($originZip, $destZip, $weightInKg)
    {
        if (! $this->apiToken || $this->apiToken === 'shippo_test_...') {
            // Si la key no es válida o falta, usar mock
            return $this->mockRate($originZip, $destZip, $weightInKg);
        }

        try {
            // Shippo requiere un Shipment para cotizar tarifas en vivo
            $response = Http::withHeaders([
                'Authorization' => "ShippoToken {$this->apiToken}",
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/shipments/", [
                'address_from' => [
                    'name' => 'Almacén Novape',
                    'street1' => 'Av. Principal 123',
                    'city' => 'Lima',
                    'state' => 'LMA',
                    'zip' => $originZip,
                    'country' => 'PE',
                ],
                'address_to' => [
                    'name' => 'Cliente',
                    'street1' => 'Dirección Destino',
                    'city' => 'Lima', // Simplificado
                    'state' => 'LMA',
                    'zip' => $destZip,
                    'country' => 'PE',
                ],
                'parcels' => [
                    [
                        'length' => '10',
                        'width' => '10',
                        'height' => '10',
                        'distance_unit' => 'in',
                        'weight' => (string) max(1, $weightInKg),
                        'mass_unit' => 'kg', // Shippo soporta lb, kg, oz, g
                    ],
                ],
                'async' => false,
            ]);

            if ($response->successful()) {
                $rates = $response->json('rates');
                if (! empty($rates)) {
                    // Tomamos la tarifa más barata por defecto
                    return (float) $rates[0]['amount'];
                }
            } else {
                Log::error('Error cotizando con Shippo API: '.$response->body());
            }

            return $this->mockRate($originZip, $destZip, $weightInKg);

        } catch (\Exception $e) {
            Log::error('Excepción cotizando Shippo: '.$e->getMessage());

            return $this->mockRate($originZip, $destZip, $weightInKg);
        }
    }

    /**
     * Fallback si Shippo no encuentra tarifas para esa ruta o falla
     */
    private function mockRate($originZip, $destZip, $weightInKg)
    {
        $baseRate = 12.00;
        $weightCost = max(0, ceil($weightInKg - 1)) * 2.00;
        $distanceCost = ($originZip === $destZip || str_starts_with($destZip, '15')) ? 0 : 15.00;

        return $baseRate + $weightCost + $distanceCost;
    }

    /**
     * Valida una dirección usando Shippo
     */
    public function validateAddress($addressData)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "ShippoToken {$this->apiToken}",
                'Content-Type' => 'application/json',
            ])->post("{$this->baseUrl}/addresses/", [
                'name' => $addressData['name'] ?? 'Cliente',
                'street1' => $addressData['street1'],
                'city' => $addressData['city'] ?? 'Lima',
                'state' => $addressData['state'] ?? 'LMA',
                'zip' => $addressData['zip'] ?? '15001',
                'country' => $addressData['country'] ?? 'PE',
                'validate' => true,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $validation = $data['validation_results'] ?? null;
                if ($validation) {
                    return [
                        'is_valid' => $validation['is_valid'] ?? true,
                        'messages' => $validation['messages'] ?? [],
                    ];
                }
            }

            return ['is_valid' => true, 'messages' => []]; // Permitir si falla la API
        } catch (\Exception $e) {
            Log::error('Error validando dirección con Shippo: '.$e->getMessage());

            // En caso de error de conexión o API, permitimos que el proceso siga adelante sin bloquear al usuario.
            return [
                'is_valid' => true,
                'messages' => [],
            ];
        }
    }

    /**
     * Rastrear un paquete usando Shippo API
     */
    public function trackPackage($carrier, $trackingNumber)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "ShippoToken {$this->apiToken}",
                'Shippo-API-Version' => '2018-02-08',
            ])->get("{$this->baseUrl}/tracks/{$carrier}/{$trackingNumber}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Shippo Tracking API Error: '.$response->body());

            return null;
        } catch (\Exception $e) {
            Log::error('Error rastreando paquete con Shippo: '.$e->getMessage());

            return null;
        }
    }
}
