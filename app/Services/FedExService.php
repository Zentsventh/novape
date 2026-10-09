<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FedExService
{
    protected $baseUrl;

    protected $clientId;

    protected $clientSecret;

    protected $accountNumber;

    public function __construct()
    {
        // Sandbox environment by default
        $this->baseUrl = config('services.fedex.url');
        $this->clientId = config('services.fedex.client_id');
        $this->clientSecret = config('services.fedex.client_secret');
        $this->accountNumber = config('services.fedex.account');
    }

    /**
     * Obtiene el token de autenticación OAuth de FedEx.
     * Almacena el token en caché para evitar llamadas innecesarias.
     */
    protected function getAccessToken()
    {
        return Cache::remember('fedex_access_token', 3500, function () {
            $response = Http::asForm()->post("{$this->baseUrl}/oauth/token", [
                'grant_type' => 'client_credentials',
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

            if ($response->successful()) {
                return $response->json('access_token');
            }

            Log::error('Error autenticando con FedEx: '.$response->body());
            throw new \Exception('No se pudo autenticar con FedEx.');
        });
    }

    /**
     * Cotiza el precio de envío basado en el peso, origen y destino.
     */
    public function getShippingRate($originZip, $destZip, $weightInKg)
    {
        // Validar si las credenciales son de prueba (mock mode)
        if ($this->clientId === 'sandbox_client_id') {
            return $this->mockRate($originZip, $destZip, $weightInKg);
        }

        try {
            $token = $this->getAccessToken();

            $response = Http::withToken($token)
                ->post("{$this->baseUrl}/rate/v1/rates/quotes", [
                    'accountNumber' => [
                        'value' => $this->accountNumber,
                    ],
                    'requestedShipment' => [
                        'shipper' => [
                            'address' => [
                                'postalCode' => $originZip,
                                'countryCode' => 'PE',
                            ],
                        ],
                        'recipient' => [
                            'address' => [
                                'postalCode' => $destZip,
                                'countryCode' => 'PE',
                            ],
                        ],
                        'pickupType' => 'DROPOFF_AT_FEDEX_LOCATION',
                        'rateRequestType' => [
                            'ACCOUNT', 'LIST',
                        ],
                        'requestedPackageLineItems' => [
                            [
                                'weight' => [
                                    'units' => 'KG',
                                    'value' => $weightInKg,
                                ],
                            ],
                        ],
                    ],
                ]);

            if ($response->successful()) {
                $rateDetails = $response->json('output.rateReplyDetails.0.ratedShipmentDetails.0.totalNetCharge');

                return $rateDetails ?? 15.00; // Fallback
            }

            Log::error('Error cotizando con FedEx API: '.$response->body());

            return 15.00; // Valor seguro por defecto si falla la API

        } catch (\Exception $e) {
            Log::error('Excepción cotizando FedEx: '.$e->getMessage());

            return 15.00;
        }
    }

    /**
     * Simulador interno si no hay credenciales configuradas
     */
    private function mockRate($originZip, $destZip, $weightInKg)
    {
        // Tarifa base
        $baseRate = 10.00;

        // Costo por peso adicional (S/ 2.50 por kg adicional después del 1ro)
        $weightCost = max(0, ceil($weightInKg - 1)) * 2.50;

        // Costo por distancia (simulado por códigos postales)
        $distanceCost = ($originZip === $destZip || str_starts_with($destZip, '15')) ? 0 : 15.00;

        return $baseRate + $weightCost + $distanceCost;
    }
}
