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
        LimaCoverage::validate($addressData);
        if (empty($cart)) {
            throw \Illuminate\Validation\ValidationException::withMessages(['cart' => 'Agrega productos antes de calcular el envío.']);
        }

        $pesoTotalKg = 0;
        $subtotal = 0;
        $parcels = [];
        $completeDimensions = true;
        $weightsKnown = true;
        foreach ($cart as $item) {
            $productId = $item['id'];
            $variants = Variante::where('producto_id', $productId)->where('activo', true)->whereHas('producto', fn ($query) => $query->where('activo', true));
            if (! empty($item['variante_id'])) {
                $variants->whereKey($item['variante_id']);
            }
            $variant = $variants->orderBy('precio')->orderBy('id')->first();
            $quantity = (int) ($item['cantidad'] ?? 0);
            if (! $variant || $quantity < 1 || $quantity > \App\Services\Storefront\CommercePolicy::summary()['max_quantity']) {
                throw \Illuminate\Validation\ValidationException::withMessages(['cart' => 'Revisa los productos y cantidades del carrito.']);
            }
            $length = (float) $variant->shipping_length_cm;
            $width = (float) $variant->shipping_width_cm;
            $height = (float) $variant->shipping_height_cm;
            $weight = (float) $variant->peso;
            $dimensions = [$length, $width, $height];
            if (min($dimensions) <= 0 || $weight <= 0) $completeDimensions = false;

            for ($i = 0; $i < $quantity; $i++) {
                $parcels[] = [
                    'length' => (string) $length, 'width' => (string) $width, 'height' => (string) $height,
                    'distance_unit' => 'cm', 'weight' => (string) $weight, 'mass_unit' => 'kg',
                ];
            }
            $pesoUnidad = (float) $variant->peso;
            $subtotal += \App\Services\Storefront\VariantPricing::quote($variant)['price'] * $quantity;
            if ($pesoUnidad <= 0) {
                $weightsKnown = false;
                $pesoUnidad = 0;
            }
            $pesoTotalKg += $pesoUnidad * max(0, (int) ($item['cantidad'] ?? 0));
        }

        $policy = \App\Services\Storefront\CommercePolicy::summary();
        $free = $policy['free_shipping_enabled'] && $subtotal >= $policy['free_shipping_threshold'];
        $costoEnvio = $free ? 0.0 : $policy['shipping_base'] + ($weightsKnown ? max(0, ceil($pesoTotalKg - 1)) * $policy['shipping_extra_kg'] : 0);

        $result = [
            'costo' => $costoEnvio,
            'peso_total' => $weightsKnown ? $pesoTotalKg : null,
            'tariff_basis' => $weightsKnown ? 'recorded_weight' : 'flat_missing_weight',
            'courier' => 'Entrega Novape',
            'currency' => 'PEN',
            'source' => $free ? 'free_shipping' : 'store',
            'delivery_window' => ['min_business_days'=>$policy['delivery_min_business_days'],'max_business_days'=>$policy['delivery_max_business_days'], 'starts_after'=>'payment_confirmation'],
            'shipping_threshold_basis' => 'subtotal_before_discounts',
            'test' => false,
        ];
        if (!$free && $completeDimensions && $this->shippoService->isConfigured() && ! empty($addressData['direccion'])) {
            $origin = config('services.shippo.origin', []);
            if (empty($origin['street1'])) {
                $warehouseId = (int) \App\Models\ConfiguracionSitio::obtener('almacen_ecommerce_id', 1);
                $warehouse = \App\Models\Almacen::whereKey($warehouseId)->where('activo', true)->first();
                if (! $warehouse && \App\Models\Almacen::where('activo', true)->count() === 1) $warehouse = \App\Models\Almacen::where('activo', true)->first();
                $origin['street1'] = $warehouse?->direccion;
                $origin['name'] = $warehouse?->nombre ?: ($origin['name'] ?? 'Novape');
            }
            $destination = ['name' => trim(($addressData['nombres'] ?? '').' '.($addressData['apellidos'] ?? '')),
                'street1' => $addressData['direccion'], 'street2' => $addressData['distrito'], 'city' => 'Lima', 'state' => 'LMA',
                'zip' => $addressData['codigo_postal'] ?? '', 'country' => 'PE', 'phone' => $addressData['celular'] ?? ''];
            if ($quote = $this->shippoService->quote($origin, $destination, $parcels)) $result = array_merge($result, $quote);
        }
        session(['checkout_shipping_cost' => $result['costo']]);
        return $result;
    }

    public function validateAddress(array $data): array
    {
        LimaCoverage::validate(['departamento' => $data['departamento'] ?? 'LIMA', 'provincia' => $data['provincia'] ?? 'LIMA', 'distrito' => $data['distrito'] ?? '']);
        // Coverage and required fields are validated locally. Do not pretend that an
        // unavailable carrier has verified a customer's address.
        return ['is_valid' => true, 'messages' => [], 'validation_source' => 'store'];
    }

    public function getTrackingData(string $carrier, string $trackingNumber): ?array
    {
        return $this->shippoService->trackPackage($carrier, $trackingNumber);
    }
}
