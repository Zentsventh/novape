<?php

declare(strict_types=1);

namespace App\Services\Checkout;

use App\Models\Pedido;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class CheckoutCompletion
{
    public function recover(): ?RedirectResponse
    {
        $code = session('checkout_pedido');
        if (! $code) return null;
        $order = Pedido::where('codigo', $code)->first();
        if (! $order || ! DB::table('payment_reconciliations')->where('pedido_id', $order->id)->where('status', 'applied')->exists()) return null;
        return $this->complete($order);
    }

    public function complete(Pedido $order): RedirectResponse
    {
        if (session('checkout_pedido') === $order->codigo) {
            session()->forget(['cart', 'checkout_pedido', 'niubiz_amount', 'niubiz_purchaseNumber', 'niubiz_attempt', 'checkout_cupon_id', 'checkout_monto', 'niubiz_quote', 'checkout_guest_email', 'checkout_shipping_cost']);
        }
        return redirect(URL::temporarySignedRoute('checkout.niubiz.success', now()->addMinutes(30), ['pedido' => $order->codigo]));
    }
}
