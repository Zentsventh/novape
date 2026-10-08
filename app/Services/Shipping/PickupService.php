<?php

declare(strict_types=1);

namespace App\Services\Shipping;

use App\Models\Almacen;
use App\Models\ConfiguracionSitio;
use App\Models\Variante;
use Illuminate\Validation\ValidationException;

final class PickupService
{
    public static function options(): array
    {
        if (ConfiguracionSitio::obtener('pickup_enabled', '0') !== '1') return [];
        $hours = ConfiguracionSitio::obtener('pickup_hours', '');
        $warehouse = Almacen::whereKey((int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1))->where('activo', true)->first();
        if (! $warehouse || ! $warehouse->direccion || ! $hours) return [];
        return [['id' => $warehouse->id, 'name' => $warehouse->nombre, 'address' => $warehouse->direccion, 'hours' => $hours]];
    }

    public static function validateCart(array $items, string $mode): void
    {
        foreach ($items as $item) {
            $variant = Variante::with('producto')->find($item['variante_id'] ?? null);
            $field = $mode === 'tienda' ? 'retiro_tienda' : 'envio_domicilio';
            if (! $variant?->producto || ! (bool) ($variant->producto->getAttribute($field) ?? true)) {
                throw ValidationException::withMessages(['deliveryType' => 'La modalidad elegida no está disponible para todos los productos.']);
            }
        }
    }

    public static function select(int $id): array
    {
        foreach (self::options() as $option) if ($option['id'] === $id) return $option;
        throw ValidationException::withMessages(['shippingAddress.pickup_location_id' => 'Selecciona una sede de retiro disponible.']);
    }
}
