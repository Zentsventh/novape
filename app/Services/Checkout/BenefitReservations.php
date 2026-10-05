<?php

declare(strict_types=1);

namespace App\Services\Checkout;

use App\Models\Cupon;
use App\Models\Pedido;
use App\Models\Usuario;
use App\Services\Orders\OrderTransitions;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class BenefitReservations
{
    public static function reserve(Pedido $order): void
    {
        $user = $order->usuario_id ? Usuario::whereKey($order->usuario_id)->lockForUpdate()->firstOrFail() : null;
        $active = DB::table('checkout_benefit_reservations')->where('expires_at', '>', now())->where('pedido_id', '!=', $order->id);
        if ($order->puntos_usados > 0) {
            $held = (clone $active)->where('usuario_id', $order->usuario_id)->sum('puntos');
            if (! $user || $user->loyalty_points - $held < $order->puntos_usados) {
                throw ValidationException::withMessages(['usePoints' => 'Los puntos están reservados en otro pedido o ya no están disponibles.']);
            }
        }
        if ($order->cupon_id) {
            $coupon = Cupon::whereKey($order->cupon_id)->lockForUpdate()->firstOrFail();
            $held = (clone $active)->where('cupon_id', $coupon->id);
            if (! $coupon->activo || ($coupon->fecha_fin && $coupon->fecha_fin < now()) ||
                ($coupon->limite_usos && $coupon->usos_actuales + (clone $held)->count() >= $coupon->limite_usos) ||
                ($coupon->unico_por_cliente && (! $user || (clone $held)->where('usuario_id', $user->id)->exists() ||
                    Pedido::where('usuario_id', $user->id)->where('cupon_id', $coupon->id)->whereRaw('LOWER(estado) IN (?, ?, ?, ?)', OrderTransitions::REVENUE_STATES)->exists()))) {
                throw ValidationException::withMessages(['coupon' => 'El cupón ya está usado, reservado o vencido.']);
            }
        }
        DB::table('checkout_benefit_reservations')->updateOrInsert(['pedido_id' => $order->id], [
            'usuario_id' => $order->usuario_id, 'cupon_id' => $order->cupon_id, 'puntos' => $order->puntos_usados,
            'expires_at' => now()->addMinutes(15), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
