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
            $previousTracking = $pedido->tracking_number;
            $previousCourier = $pedido->courier_name;
            $previousDelivery = $pedido->envio?->estado ?: 'Preparando';
            $pickup = ($pedido->direccion_envio_snapshot['delivery_type'] ?? '') === 'tienda' || ($pedido->direccion_envio_snapshot['shipping_quote']['source'] ?? '') === 'pickup';
            $deliveryState = !empty($data['estado_envio']) ? $data['estado_envio'] : $previousDelivery;
            
            // Auto-align states for convenience
            if ($nuevoEstado === 'enviado') $deliveryState = 'Enviado';
            if ($nuevoEstado === 'completado') $deliveryState = $pickup ? 'Recogido' : 'Entregado';
            if (in_array($deliveryState, ['Entregado', 'Recogido'], true) && $nuevoEstado !== 'cancelado') $nuevoEstado = 'completado';
            if ($deliveryState === 'Enviado' && $nuevoEstado !== 'cancelado' && $nuevoEstado !== 'completado') $nuevoEstado = 'enviado';

            $reference = trim($data['fulfillment_reference'] ?? $pedido->fulfillment_reference ?? '');
            $delivered = in_array($deliveryState, ['Entregado', 'Recogido'], true);
            
            if ($nuevoEstado === 'completado' && !$reference) {
                throw new \InvalidArgumentException('Confirma Entregado o Recogido e indica la referencia de recepción antes de completar el pedido.');
            }
            
            $leftWarehouse = $pedido->dispatched_at || in_array($estadoAnterior,['enviado','completado'],true) || in_array($previousDelivery,['Enviado','Entregado','Recogido'],true);
            $pedido->update([
                'estado' => $nuevoEstado,
                'tracking_number' => $data['tracking_number'] ?? $pedido->tracking_number,
                'courier_name' => $data['courier_name'] ?? $pedido->courier_name,
                'fulfillment_reference' => $reference ?: null,
                'fulfilled_at' => $nuevoEstado === 'completado' ? ($pedido->fulfilled_at ?? now()) : $pedido->fulfilled_at,
                'dispatched_at' => $nuevoEstado === 'enviado' ? ($pedido->dispatched_at ?? now()) : $pedido->dispatched_at,
            ]);
            if (array_key_exists('tracking_number', $data) || array_key_exists('courier_name', $data) || ! empty($data['estado_envio'])) {
                if ($nuevoEstado === 'pendiente' || $nuevoEstado === 'cancelado') {
                    if ((! empty($data['tracking_number']) && $data['tracking_number'] !== $previousTracking)
                        || (! empty($data['estado_envio']) && $data['estado_envio'] !== $previousDelivery)) throw new \InvalidArgumentException('Solo puedes preparar entregas de pedidos pagados.');
                } else {
                    $pickup = ($pedido->direccion_envio_snapshot['delivery_type'] ?? '') === 'tienda' || ($pedido->direccion_envio_snapshot['shipping_quote']['source'] ?? '') === 'pickup';
                    $deliveryState = $data['estado_envio'] ?? $previousDelivery;
                    if (($pickup && in_array($deliveryState, ['Enviado', 'Entregado'], true)) || (! $pickup && in_array($deliveryState, ['Listo para recoger', 'Recogido'], true))) {
                        throw new \InvalidArgumentException('El estado de entrega no corresponde a la modalidad del pedido.');
                    }
                    $pedido->envio()->updateOrCreate(['pedido_id' => $pedido->id], ['tracking' => $pedido->tracking_number,
                        'proveedor' => $pedido->courier_name, 'estado' => $deliveryState]);
                    $pedido->unsetRelation('envio');
                }
            }
            if ($nuevoEstado === 'cancelado') {
                DB::table('checkout_benefit_reservations')->where('pedido_id', $pedido->id)->delete();
                if ($estadoAnterior !== 'cancelado') OrderLoyaltyService::reversed($pedido);
            }

            if ($nuevoEstado === 'cancelado' && $estadoAnterior !== 'cancelado' && $consumed) {
                if (!$leftWarehouse) {
                    $this->inventoryService->returnStockForOrder($pedido, (int) auth('admin')->id(), 'Cancelación antes de despacho');
                    $pedido->update(['stock_returned_at' => now()]);
                }

                // Restaurar Beneficios del Cliente (Puntos y Cupones)
                if ($pedido->cupon_id) {
                    Cupon::where('id', $pedido->cupon_id)->where('usos_actuales', '>', 0)->decrement('usos_actuales');
                }

                OrderLoyaltyService::restoreRedeemed($pedido);

                // Sincronizar CRM: Si se cancela el pedido, cerrar oportunidad como perdida
                if ($pedido->crm_deal_id) {
                    $deal = CrmDeal::whereKey($pedido->crm_deal_id)->lockForUpdate()->first();

                    if ($deal) {
                        app(CrmPipelineService::class)->updateDealStage($deal, ['stage_id' => $deal->stage_id, 'estado' => 'lost']);
                        CrmActivity::create([
                            'deal_id' => $deal->id,
                            'usuario_id' => auth('admin')->id(),
                            'tipo' => 'system',
                            'contenido' => "El pedido {$pedido->codigo} fue cancelado. ".($leftWarehouse ? 'La recepción física requiere RMA.' : 'Stock liberado antes del despacho.'),
                        ]);
                    }
                }
            }

            if ($estadoAnterior !== $nuevoEstado || $previousTracking !== $pedido->tracking_number || $previousCourier !== $pedido->courier_name || $previousDelivery !== $pedido->envio?->estado) {
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
