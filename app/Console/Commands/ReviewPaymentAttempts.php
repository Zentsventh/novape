<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
class ReviewPaymentAttempts extends Command
{
    protected $signature = 'store:review-payment-attempts';
    protected $description = 'Caducar sesiones sin autorización y señalar pagos inciertos sin repetir cobros';
    public function handle(): int
    {
        $ids = DB::table('payment_reconciliations')->whereIn('status',['preparing','prepared'])->where('expires_at','<=',now())->pluck('id');
        foreach ($ids as $id) DB::transaction(function () use ($id) {
            $orderId = DB::table('payment_reconciliations')->where('id',$id)->value('pedido_id');
            DB::table('pedido')->where('id',$orderId)->lockForUpdate()->first();
            $attempt = DB::table('payment_reconciliations')->where('id',$id)->lockForUpdate()->first();
            if (!$attempt || !in_array($attempt->status,['preparing','prepared'],true)) return;
            DB::table('payment_reconciliations')->where('id',$id)->update(['status'=>'expired','updated_at'=>now()]);
            $active = DB::table('payment_reconciliations')->where('pedido_id',$attempt->pedido_id)->where('id','!=',$id)->whereIn('status',['preparing','prepared','authorizing','approved','needs_review'])->exists();
            if (!$active && ($order = DB::table('pedido')->where('id',$attempt->pedido_id)->first()) && strtolower($order->estado)==='pendiente') {
                DB::table('reservas_stock')->where('session_id',$order->checkout_session_id)->delete();
                DB::table('checkout_benefit_reservations')->where('pedido_id',$order->id)->delete();
            }
        });
        $uncertain = DB::table('payment_reconciliations')->where('status','authorizing')->where('updated_at','<',now()->subMinutes(5))
            ->update(['status'=>'needs_review','error'=>'Autorización sin resultado definitivo. Verificar en Niubiz; no repetir cobro.','review_due_at'=>now(),'updated_at'=>now()]);
        $this->info('Sesiones caducadas: '.count($ids).'. Autorizaciones pendientes de conciliación: '.$uncertain);
        return self::SUCCESS;
    }
}
