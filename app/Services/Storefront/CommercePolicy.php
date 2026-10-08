<?php
declare(strict_types=1);
namespace App\Services\Storefront;

use App\Models\ConfiguracionSitio;

final class CommercePolicy
{
    public static function number(string $key, float $default): float
    {
        return max(0, (float) ConfiguracionSitio::obtener($key, (string) $default));
    }
    public static function summary(): array
    {
        return [
            'max_quantity' => (int) self::number('store_max_quantity', 5),
            'minimum_payment' => self::number('store_minimum_payment', 2),
            'free_shipping_enabled' => ConfiguracionSitio::obtener('envio_gratis', '1') === '1',
            'free_shipping_threshold' => self::number('store_free_shipping_threshold', 299),
            'shipping_base' => self::number('store_shipping_base', 12),
            'shipping_extra_kg' => self::number('store_shipping_extra_kg', 2),
            'delivery_min_business_days' => (int) self::number('store_delivery_min_days', 2),
            'delivery_max_business_days' => (int) self::number('store_delivery_max_days', 5),
            'return_window_days' => (int) self::number('store_return_window_days', 30),
            'points_per_sol' => 10,
            'coupon_points_combinable' => ConfiguracionSitio::obtener('store_coupon_points_combinable', '1') === '1',
            'shipping_threshold_basis' => 'subtotal_before_discounts',
            'reservation_minutes' => 15,
            'exchange_mode' => 'return_and_new_order',
        ];
    }
}
