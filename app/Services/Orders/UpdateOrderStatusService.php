<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\CrmActivity;
use App\Models\CrmDeal;
use App\Models\Cupon;
use App\Models\LoyaltyPointsHistory;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Services\Admin\Crm\CrmPipelineService;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UpdateOrderStatusService
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    /**
     * Updates an order's state and triggers related side-effects (stock, notifications).
     *
     * @param  array<string, mixed>  $data
     *
     * @throws \Throwable
     */
    public function execute(Pedido $pedido, array $data): void
    {
        $nuevoEstado = strtolower($data['estado']);
        if (! $pedido->exists) {
            OrderTransitions::validate($pedido, $nuevoEstado);
        }

        DB::beginTransaction();
        try {
            $pedido = Pedido::whereKey($pedido->id)->lockForUpdate()->firstOrFail();
            $estadoAnterior = strtolower($pedido->estado);
            OrderTransitions::validate($pedido, $nuevoEstado);
            $consumed = $pedido->stock_consumed_at !== null;
            $pedido->update([
                'estado' => $nuevoEstado,
                'tracking_number' => $data['tracking_number'] ?? $pedido->tracking_number,
                'courier_name' => $data['courier_name'] ?? $pedido->courier_name,
            ]);
            if ($nuevoEstado === 'cancelado') {
                DB::table('checkout_benefit_reservations')->where('pedido_id', $pedido->id)->delete();
            }

            if ($nuevoEstado === 'cancelado' && $estadoAnterior !== 'cancelado' && $consumed) {
                $this->inventoryService->returnStockForOrder($pedido, (int) auth('admin')->id(), 'Cancelación Administrativa');
                $pedido->update(['stock_returned_at' => now()]);

                // Restaurar Beneficios del Cliente (Puntos y Cupones)
                if ($pedido->cupon_id) {
                    Cupon::where('id', $pedido->cupon_id)->where('usos_actuales', '>', 0)->decrement('usos_actuales');
                }

                if ($pedido->puntos_usados > 0 && $pedido->usuario_id) {
                    $user = Usuario::find($pedido->usuario_id);
                    if ($user) {
                        $user->increment('loyalty_points', $pedido->puntos_usados);
                        LoyaltyPointsHistory::create([
                            'usuario_id' => $user->id,
                            'points' => $pedido->puntos_usados,
                            'type' => 'refunded',
                            'description' => "Puntos devueltos por cancelación del pedido {$pedido->codigo}",
                        ]);
                    }
                }

                // Sincronizar CRM: Si se cancela el pedido, cerrar oportunidad como perdida
                if ($pedido->crm_deal_id) {
                    $deal = CrmDeal::whereKey($pedido->crm_deal_id)->lockForUpdate()->first();

                    if ($deal) {
                        app(CrmPipelineService::class)->updateDealStage($deal, ['stage_id' => $deal->stage_id, 'estado' => 'lost']);
                        CrmActivity::create([
                            'deal_id' => $deal->id,
                            'usuario_id' => auth('admin')->id(),
                            'tipo' => 'system',
                            'contenido' => "El pedido {$pedido->codigo} fue cancelado y devuelto a inventario.",
                        ]);
                    }
                }
            }

            if ($estadoAnterior !== $nuevoEstado) {
                OrderNotificationOutbox::record($pedido);
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error al actualizar estado y stock del pedido '.$pedido->id.': '.$e->getMessage());
            throw $e;
        }

    }
}
