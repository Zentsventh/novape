<?php

namespace App\Services\Inventario;

use App\Models\StockAlmacen;
use App\Models\InventarioMovimiento;
use App\Models\Variante;
use App\Models\Almacen;
use App\Services\Inventory\StockAvailability;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Exception;

class InventoryService
{
    public function registrarMovimiento(
        int $varianteId,
        int $almacenId,
        int $cantidad,
        string $tipo,
        string $motivo,
        ?int $usuarioId = null,
        $referencia = null,
        ?float $costoUnitario = null,
        ?string $operationKey = null,
        ?string $reservationSessionId = null
    ): InventarioMovimiento {
        if ($cantidad === 0) {
            throw ValidationException::withMessages(['error' => 'La cantidad del movimiento no puede ser cero.']);
        }

        return DB::transaction(function () use (
            $varianteId,
            $almacenId,
            $cantidad,
            $tipo,
            $motivo,
            $usuarioId,
            $referencia,
            $costoUnitario,
            $operationKey,
            $reservationSessionId
        ) {
            // All writers and reservation creation acquire the variant first.
            Variante::withTrashed()->whereKey($varianteId)->lockForUpdate()->firstOrFail();
            if ($operationKey) {
                $existing = InventarioMovimiento::where('operation_key', $operationKey)->first();
                if ($existing) {
                    if ((int) $existing->variante_id !== $varianteId || (int) $existing->almacen_id !== $almacenId || (int) $existing->cantidad !== $cantidad || $existing->tipo !== $tipo) {
                        throw ValidationException::withMessages(['operation_key' => 'Esta operación ya fue usada para otro movimiento.']);
                    }
                    return $existing;
                }
            }
            $warehouse = Almacen::whereKey($almacenId)->lockForUpdate()->first();
            if (! $warehouse || ! $warehouse->activo) {
                throw ValidationException::withMessages(['almacen_id' => 'El almacén no está activo.']);
            }
            // 1. Obtener o crear el registro en stock_almacen bloqueando para actualización concurrente
            $almacenStock = StockAlmacen::where('variante_id', $varianteId)
                ->where('almacen_id', $almacenId)
                ->lockForUpdate()
                ->first();

            if (!$almacenStock) {
                if ($cantidad < 0) {
                    throw ValidationException::withMessages(['error' => 'No hay stock suficiente en este almacén para la variante indicada.']);
                }
                
                $almacenStock = StockAlmacen::create([
                    'variante_id' => $varianteId,
                    'almacen_id' => $almacenId,
                    'cantidad' => 0
                ]);
            }

            $stockAnterior = $almacenStock->cantidad;
            $nuevoStock = $stockAnterior + $cantidad;

            if ($nuevoStock < 0) {
                throw ValidationException::withMessages(['error' => "El movimiento dejaría el stock en negativo (Actual: {$stockAnterior}, Intentado: {$cantidad})."]);
            }
            if ($cantidad < 0) {
                StockAvailability::assertRemaining($varianteId, $almacenId, $nuevoStock, $reservationSessionId);
            }

            // 2. Registrar el movimiento (Kardex)
            $movimiento = InventarioMovimiento::create([
                'variante_id' => $varianteId,
                'almacen_id' => $almacenId,
                'usuario_id' => $usuarioId,
                'tipo' => $tipo,
                'cantidad' => $cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $nuevoStock,
                'costo_unitario' => $costoUnitario,
                'motivo' => $motivo,
                'referencia_tipo' => $referencia ? get_class($referencia) : null,
                'referencia_id' => $referencia ? $referencia->id : null,
                'operation_key' => $operationKey,
            ]);

            // 3. Actualizar el stock físico en stock_almacen
            $almacenStock->cantidad = $nuevoStock;
            $almacenStock->save();

            // 4. Sincronizar el stock global de la variante (suma de todos los almacenes)
            $this->sincronizarStockGlobalVariante($varianteId);

            \App\Services\Operations\OperationEvents::record('inventory.movement', 'inventario_movimientos', $movimiento->id,
                ['variant_id' => $varianteId, 'warehouse_id' => $almacenId, 'quantity' => $cantidad, 'before' => $stockAnterior, 'after' => $nuevoStock, 'operation_key' => $operationKey], $usuarioId);

            return $movimiento;
        });
    }

    protected function sincronizarStockGlobalVariante(int $varianteId): void
    {
        $totales = StockAlmacen::where('variante_id', $varianteId)
            ->selectRaw('SUM(cantidad) as total_fisico')
            ->first();

        Variante::where('id', $varianteId)->update([
            'stock' => $totales->total_fisico ?? 0,
        ]);
    }
}
