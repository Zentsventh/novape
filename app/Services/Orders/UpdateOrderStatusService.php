<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Jobs\SendWhatsAppNotification;
use App\Mail\OrderStatusUpdated;
use App\Models\Pedido;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class UpdateOrderStatusService
{
    public function __construct(
        private readonly InventoryService $inventoryService
    ) {}

    /**
     * Updates an order's state and triggers related side-effects (stock, notifications).
     *
     * @param array<string, mixed> $data
     * @throws \Throwable
     */
    public function execute(Pedido $pedido, array $data): void
    {
        $estadoAnterior = $pedido->estado;
        $nuevoEstado = $data['estado'];

        DB::beginTransaction();
        try {
            $pedido->update([
                'estado' => $nuevoEstado,
                'tracking_number' => $data['tracking_number'] ?? $pedido->tracking_number,
                'courier_name' => $data['courier_name'] ?? $pedido->courier_name,
            ]);

            if ($nuevoEstado === 'cancelado' && $estadoAnterior !== 'cancelado') {
                $this->inventoryService->returnStockForOrder($pedido, auth()->id() ?? 1, 'Cancelación Administrativa');

                // Restaurar Beneficios del Cliente (Puntos y Cupones)
                if ($pedido->cupon_id) {
                    \App\Models\Cupon::where('id', $pedido->cupon_id)->where('usos_actuales', '>', 0)->decrement('usos_actuales');
                }

                if ($pedido->puntos_usados > 0 && $pedido->usuario_id) {
                    $user = \App\Models\Usuario::find($pedido->usuario_id);
                    if ($user) {
                        $user->increment('loyalty_points', $pedido->puntos_usados);
                        \App\Models\LoyaltyPointsHistory::create([
                            'usuario_id' => $user->id,
                            'points' => $pedido->puntos_usados,
                            'type' => 'refunded',
                            'description' => "Puntos devueltos por cancelación del pedido {$pedido->codigo}",
                        ]);
                    }
                }

                // Sincronizar CRM: Si se cancela el pedido, cerrar oportunidad como perdida
                if ($pedido->usuario_id) {
                    $deal = \App\Models\CrmDeal::where('usuario_id', $pedido->usuario_id)
                                ->where('estado', 'open')
                                ->first();

                    if ($deal) {
                        $deal->update(['estado' => 'lost']);
                        \App\Models\CrmActivity::create([
                            'deal_id' => $deal->id,
                            'tipo' => 'system',
                            'titulo' => 'Pedido Cancelado',
                            'descripcion' => "El pedido {$pedido->codigo} fue cancelado y devuelto a inventario.",
                        ]);
                    }
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error al actualizar estado y stock del pedido ' . $pedido->id . ': ' . $e->getMessage());
            throw $e;
        }

        $this->sendNotifications($pedido, $data);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function sendNotifications(Pedido $pedido, array $data): void
    {
        try {
            if ($pedido->usuario && filter_var($pedido->usuario->email, FILTER_VALIDATE_EMAIL)) {
                Mail::to($pedido->usuario->email)->send(new OrderStatusUpdated($pedido));
            }

            if ($pedido->usuario && !empty($pedido->usuario->telefono)) {
                $mensajeWa = "¡Hola {$pedido->usuario->nombres}! El estado de tu pedido {$pedido->codigo} se ha actualizado a: {$data['estado']}.";
                if (!empty($data['tracking_number'])) {
                    $mensajeWa .= " Tu código de rastreo por {$pedido->courier_name} es: {$data['tracking_number']}.";
                }
                SendWhatsAppNotification::dispatch($pedido->usuario->telefono, $mensajeWa);
            }
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar notificaciones (Email/WhatsApp) de actualización de estado: ' . $e->getMessage());
        }
    }
}
