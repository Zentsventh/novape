<?php

declare(strict_types=1);

namespace App\Services\Inventory;

use App\Models\ConfiguracionSitio;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

final class StockAvailability
{
    // Caller holds the variant lock; every inventory writer shares that lock.
    public static function reserved(int $variantId, int $warehouseId): int
    {
        if ($warehouseId !== (int) ConfiguracionSitio::obtener('almacen_ecommerce_id', 1) || ! Schema::hasTable('reservas_stock')) {
            return 0;
        }

        return (int) DB::table('reservas_stock')->where('variante_id', $variantId)->where('expires_at', '>', now())->sum('cantidad');
    }

    public static function assertRemaining(int $variantId, int $warehouseId, int $remaining): void
    {
        if ($remaining < self::reserved($variantId, $warehouseId)) {
            throw ValidationException::withMessages(['cantidad' => 'La operación consumiría stock reservado para pedidos web.']);
        }
    }
}
