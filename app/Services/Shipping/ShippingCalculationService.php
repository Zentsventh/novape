<?php

declare(strict_types=1);

namespace App\Services\Shipping;

use App\Models\Variante;
use App\Services\ShippoService;

class ShippingCalculationService
{
    public function __construct(
        private readonly ShippoService $shippoService
    ) {}

    public function calculateCost(array $cart, array $addressData): array
    {
        if (empty($cart)) {
            return ['costo' => 0, 'peso_total' => 0, 'courier' => 'Shippo'];
        }

        $pesoTotalKg = 0;
        foreach ($cart as $item) {
            $productId = $item['id'];
            $variants = Variante::where('producto_id', $productId)->where('activo', true);
            if (! empty($item['variante_id'])) {
                $variants->whereKey($item['variante_id']);
            }
            $pesoUnidad = (float) ($variants->orderBy('id')->value('peso') ?? 1.0);
            if ($pesoUnidad <= 0) {
                $pesoUnidad = 1.0;
            }
            $pesoTotalKg += $pesoUnidad * max(0, (int) ($item['cantidad'] ?? 0));
        }

        $destZip = $addressData['codigo_postal'] ?? '';
        if (empty($destZip)) {
            if (strtolower($addressData['departamento'] ?? '') === 'lima') {
                $destZip = '15001';
            } else {
                $destZip = '04001';
            }
        }

        $originZip = '15401';
        $costoEnvio = $this->shippoService->getShippingRate($originZip, $destZip, $pesoTotalKg);

        session(['checkout_shipping_cost' => $costoEnvio]);

        return [
            'costo' => $costoEnvio,
            'peso_total' => $pesoTotalKg,
            'courier' => 'Shippo',
        ];
    }

    public function validateAddress(array $data): array
    {
        $addressData = [
            'name' => $data['nombres'].' '.$data['apellidos'],
            'street1' => $data['direccion'],
            'city' => $data['provincia'] ?? 'Lima',
            'state' => $data['departamento'] ?? 'LMA',
            'country' => 'PE',
        ];

        return $this->shippoService->validateAddress($addressData);
    }

    public function getTrackingData(string $carrier, string $trackingNumber): ?array
    {
        return $this->shippoService->trackPackage($carrier, $trackingNumber);
    }
}
