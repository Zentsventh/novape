<?php

declare(strict_types=1);

namespace App\Services\Orders;

use App\Models\LoyaltyPointsHistory;
use App\Models\Pedido;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

final class OrderLoyaltyService
{
    public static function completed(Pedido $order): void
    {
        if (! $order->usuario_id) return;
        DB::transaction(function () use ($order) {
            $user = Usuario::whereKey($order->usuario_id)->lockForUpdate()->first();
            if (! $user) return;
            if (!data_get($user->custom_fields, 'store_consent.loyalty_program', false)) return;
            $ledger = DB::table('loyalty_order_ledger')->where('pedido_id', $order->id)->first();
            if ($ledger && ($ledger->earned_points > 0 || $ledger->reversed_at)) return;
            $points = (int) floor((float) $order->total / 10);
            $refunded = (float) DB::table('refund_requests')->where('pedido_id', $order->id)->where('status', 'confirmed')->sum('amount');
            $reversed = (float) $order->total > 0 ? min($points, (int) floor($points * $refunded / (float) $order->total)) : 0;
            DB::table('loyalty_order_ledger')->updateOrInsert(['pedido_id' => $order->id], ['usuario_id' => $user->id,
                'earned_points' => $points, 'reversed_points' => $reversed, 'created_at' => now(), 'updated_at' => now()]);
            if ($points - $reversed > 0) {
                $user->increment('loyalty_points', $points - $reversed);
                LoyaltyPointsHistory::create(['usuario_id' => $user->id, 'points' => $points - $reversed, 'type' => 'earned', 'description' => 'Puntos obtenidos por pedido #'.$order->id]);
            }
        });
    }

    public static function reversed(Pedido $order): void
    {
        if (! $order->usuario_id) return;
        $user = Usuario::whereKey($order->usuario_id)->lockForUpdate()->first();
        if (! $user) return;
        $ledger = DB::table('loyalty_order_ledger')->where('pedido_id', $order->id)->lockForUpdate()->first();
        if (! $ledger) {
            // Preserve and reconcile points awarded before this ledger existed.
            $points = (int) LoyaltyPointsHistory::where('usuario_id', $user->id)->where('type', 'earned')
                ->where('description', 'Puntos obtenidos por pedido #'.$order->id)->sum('points');
            DB::table('loyalty_order_ledger')->insert(['pedido_id' => $order->id, 'usuario_id' => $user->id,
                'earned_points' => $points, 'created_at' => now(), 'updated_at' => now()]);
            $ledger = DB::table('loyalty_order_ledger')->where('pedido_id', $order->id)->first();
        }
        if ($ledger->reversed_at) return;
        DB::table('loyalty_order_ledger')->where('id', $ledger->id)->update(['reversed_points' => $ledger->earned_points, 'reversed_at' => now(), 'updated_at' => now()]);
        $remaining = $ledger->earned_points - ($ledger->reversed_points ?? 0);
        if ($remaining > 0) {
            // A negative balance offsets points already spent; checkout only redeems positive balances.
            $user->decrement('loyalty_points', $remaining);
            LoyaltyPointsHistory::create(['usuario_id' => $user->id, 'points' => $remaining,
                'type' => 'reversed', 'description' => 'Puntos anulados por devolución del pedido #'.$order->id]);
        }
    }

    public static function partialRefund(Pedido $order, float $cumulativeRefunded): void
    {
        if (! $order->usuario_id || (float) $order->total <= 0) return;
        $user = Usuario::whereKey($order->usuario_id)->lockForUpdate()->first();
        if (! $user) return;
        $ledger = DB::table('loyalty_order_ledger')->where('pedido_id', $order->id)->lockForUpdate()->first();
        if (! $ledger) {
            $earned = (int) LoyaltyPointsHistory::where('usuario_id', $user->id)->where('type', 'earned')->where('description', 'Puntos obtenidos por pedido #'.$order->id)->sum('points');
            DB::table('loyalty_order_ledger')->insert(['pedido_id' => $order->id, 'usuario_id' => $user->id, 'earned_points' => $earned,
                'created_at' => now(), 'updated_at' => now()]);
            $ledger = DB::table('loyalty_order_ledger')->where('pedido_id', $order->id)->first();
        }
        if ($ledger->reversed_at) return;
        $target = min($ledger->earned_points, (int) floor($ledger->earned_points * $cumulativeRefunded / (float) $order->total));
        $delta = $target - $ledger->reversed_points;
        if ($delta <= 0) return;
        $user->decrement('loyalty_points', $delta);
        DB::table('loyalty_order_ledger')->where('id', $ledger->id)->update(['reversed_points' => $target, 'updated_at' => now()]);
        LoyaltyPointsHistory::create(['usuario_id' => $user->id, 'points' => $delta, 'type' => 'reversed', 'description' => 'Puntos anulados por devolución parcial del pedido #'.$order->id]);
    }

    public static function restoreRedeemed(Pedido $order, ?int $target = null): void
    {
        if (!$order->usuario_id || !$order->puntos_usados) return;
        $target = min((int)$order->puntos_usados, $target ?? (int)$order->puntos_usados);
        $restored = (int)$order->redeemed_points_restored;
        if ($target <= $restored) return;
        $user = Usuario::whereKey($order->usuario_id)->lockForUpdate()->firstOrFail();
        $user->increment('loyalty_points',$target-$restored);
        LoyaltyPointsHistory::create(['usuario_id'=>$user->id,'points'=>$target-$restored,'type'=>'refunded','description'=>'Canje restituido por devolución del pedido '.$order->codigo]);
        $order->update(['redeemed_points_restored'=>$target]);
    }
}
