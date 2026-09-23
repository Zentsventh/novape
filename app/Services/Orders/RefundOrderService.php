<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Refund;
use Stripe\Stripe;

class RefundOrderService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly UpdateOrderStatusService $updateOrderStatusService
    ) {}

    /**
     * @return array{success: bool, message: string}
     */
    public function execute(Pedido $pedido): array
    {
        if ($pedido->estado === 'cancelado') {
            return ['success' => false, 'message' => 'El pedido ya está cancelado.'];
        }

        if (!$pedido->pago || $pedido->pago->estado !== 'completado') {
            return ['success' => false, 'message' => 'El pedido no tiene un pago completado que se pueda reembolsar.'];
        }

        DB::beginTransaction();
        try {
            if ($pedido->pago->metodo_pago === 'Stripe' && $pedido->pago->transaccion_id) {
                Stripe::setApiKey(env('STRIPE_SECRET'));
                Refund::create([
                    'payment_intent' => $pedido->pago->transaccion_id,
                ]);
            } elseif ($pedido->pago->metodo_pago === 'Niubiz') {
                Log::info("Reembolso Niubiz solicitado para pedido {$pedido->id}. La API requiere anulación manual.");
                $pedido->pago->update(['estado' => 'reembolso_pendiente']);
                DB::commit();

                return ['success' => true, 'message' => 'El pago por Niubiz requiere anulación manual en su portal. Estado cambiado a Reembolso Pendiente.'];
            }

            // Delegar la cancelación al servicio central para disparar los side-effects (CRM, Puntos, Correos)
            $this->updateOrderStatusService->execute($pedido, ['estado' => 'cancelado']);
            
            $pedido->pago->update(['estado' => 'reembolsado']);

            DB::commit();

            return ['success' => true, 'message' => 'El pedido ha sido reembolsado, cancelado y el stock restaurado exitosamente.'];
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error reembolsando pedido ' . $pedido->id . ': ' . $e->getMessage());

            return ['success' => false, 'message' => 'Ocurrió un error al procesar el reembolso.'];
        }
    }
}
