<?php

declare(strict_types=1);

namespace App\Services\Checkout;

use App\Models\Pedido;
use App\Services\Orders\PaidInvoiceRegistry;
use Illuminate\Support\Facades\DB;

final class ApprovedPaymentCompletion
{
    public function apply(int $attemptId, ?string $transactionReference = null): Pedido
    {
        return DB::transaction(function () use ($attemptId, $transactionReference) {
            $orderId = DB::table('payment_reconciliations')->where('id', $attemptId)->value('pedido_id');
            $order = Pedido::whereKey($orderId)->lockForUpdate()->firstOrFail();
            $attempt = DB::table('payment_reconciliations')->where('id', $attemptId)->lockForUpdate()->firstOrFail();
            if ($attempt->status === 'applied') return $order;
            if ($attempt->status !== 'approved' || !$attempt->approved_at) {
                throw new \RuntimeException('El intento no tiene una aprobación confirmada de Niubiz.');
            }
            if (DB::table('payment_reconciliations')->where('pedido_id', $orderId)->where('id', '!=', $attemptId)->where('status', 'applied')->exists()) {
                throw new \RuntimeException('El pedido ya tiene otro pago aplicado. Revisa este intento antes de continuar.');
            }
            // The purchase number is the original provider order reference. Recovery
            // applies its recorded approval locally; it never sends another charge.
            $reference = $transactionReference ?? 'niubiz:purchase:'.$attempt->purchase_number;
            if (!app(CheckoutService::class)->processSuccessfulPayment($order->codigo, (float) $attempt->amount, $reference)) {
                throw new \RuntimeException('No se pudo aplicar el pago confirmado al pedido.');
            }
            app(PaidInvoiceRegistry::class)->register($order->fresh());
            DB::table('payment_reconciliations')->where('id', $attemptId)->update(['status'=>'applied','error'=>null,'updated_at'=>now()]);
            return $order->fresh();
        });
    }
}
