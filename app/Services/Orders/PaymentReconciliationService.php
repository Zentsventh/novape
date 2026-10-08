<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\Pedido;
use App\Services\Checkout\CheckoutService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PaymentReconciliationService
{
    public function resolve(int $id, array $data, int $actor): void
    {
        $observed = DB::transaction(function () use ($id, $data, $actor) {
            $orderId = DB::table('payment_reconciliations')->where('id',$id)->value('pedido_id');
            Pedido::whereKey($orderId)->lockForUpdate()->firstOrFail();
            $row = DB::table('payment_reconciliations')->where('id', $id)->lockForUpdate()->firstOrFail();
            if ($row->status === 'applied') return $row;
            if (! in_array($row->status, ['authorizing', 'approved', 'needs_review'], true)) $this->invalid('Este intento no requiere conciliación.');
            if ($row->status === 'approved' && $data['result'] !== 'approved') $this->invalid('Una aprobación confirmada no puede convertirse en rechazo. Revisa su aplicación o devolución.');
            $previous = DB::table('payment_resolution_events')->where('reconciliation_id', $id)->where('result', 'approved')->first();
            if ($previous && $previous->provider_reference !== $data['provider_reference']) $this->invalid('Conserva la referencia de aprobación registrada.');
            if ($row->status === 'authorizing' && \Carbon\Carbon::parse($row->updated_at)->greaterThan(now()->subMinutes(5))) $this->invalid('Espera a que finalice la autorización en curso.');
            if (abs((float) $row->amount - (float) $data['amount']) > 0.001 || $data['currency'] !== 'PEN') $this->invalid('El importe o moneda no coincide con el intento original.');
            $reference = DB::table('payment_resolution_events')->where('provider_reference', $data['provider_reference'])->first();
            if ($reference && ($reference->reconciliation_id !== $id || $reference->result !== $data['result'])) $this->invalid('Esta referencia ya pertenece a otro resultado.');
            if (! $reference) DB::table('payment_resolution_events')->insert(['reconciliation_id' => $id, 'actor_id' => $actor, 'result' => $data['result'],
                'amount' => $data['amount'], 'provider_reference' => $data['provider_reference'], 'evidence' => $data['evidence'], 'created_at' => now()]);
            DB::table('payment_reconciliations')->where('id', $id)->update(['status' => $data['result'] === 'approved' ? 'approved' : 'declined',
                'error' => null, 'approved_at' => $data['result'] === 'approved' ? now() : null, 'updated_at' => now()]);
            return DB::table('payment_reconciliations')->find($id);
        });
        if (data_get($observed, 'status') !== 'approved') return;
        // Preserve the approval and operator evidence even if applying stock or benefits fails.
        DB::transaction(function () use ($id, $data) {
            $orderId = DB::table('payment_reconciliations')->where('id',$id)->value('pedido_id');
            Pedido::whereKey($orderId)->lockForUpdate()->firstOrFail();
            $row = DB::table('payment_reconciliations')->where('id', $id)->lockForUpdate()->firstOrFail();
            if ($row->status === 'applied') return;
            $order = Pedido::whereKey($row->pedido_id)->lockForUpdate()->firstOrFail();
            if (DB::table('payment_reconciliations')->where('pedido_id', $order->id)->where('id', '!=', $id)->where('status', 'applied')->exists()) $this->invalid('El pedido ya tiene un pago aplicado. Revisa el cargo adicional.');
            if (! app(CheckoutService::class)->processSuccessfulPayment($order->codigo, (float) $row->amount, $data['provider_reference'])) $this->invalid('El pedido ya no está pendiente. Revisa el cobro antes de continuar.');
            app(PaidInvoiceRegistry::class)->register($order->fresh());
            DB::table('payment_reconciliations')->where('id', $id)->update(['status' => 'applied', 'updated_at' => now()]);
        });
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['payment' => $message]);
    }
}
