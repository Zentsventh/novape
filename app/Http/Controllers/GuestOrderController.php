<?php
namespace App\Http\Controllers;
use App\Models\Pedido;
use App\Services\Orders\ReturnRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
class GuestOrderController extends Controller
{
    public function show(string $codigo)
    {
        $order = Pedido::where('codigo',$codigo)->with('items','envio')->firstOrFail();
        return response()->view('store.order-access',['order'=>$order,
            'requests'=>\App\Models\RmaRequest::where('pedido_id',$order->id)->latest()->get(),
            'paymentStatus'=>\Illuminate\Support\Facades\DB::table('payment_reconciliations')->where('pedido_id',$order->id)->latest('id')->value('status'),
            'resumeUrl'=>URL::temporarySignedRoute('store.order.resume',now()->addHours(2),['codigo'=>$codigo]),
            'returnUrl'=>URL::temporarySignedRoute('store.order.return',now()->addHours(2),['codigo'=>$codigo])])->header('Cache-Control','private, no-store')->header('Referrer-Policy','no-referrer');
    }
    public function resume(Request $request,string $codigo)
    {
        \Illuminate\Support\Facades\DB::transaction(function() use ($codigo) {
            $order=Pedido::where('codigo',$codigo)->lockForUpdate()->firstOrFail();
            if ($order->usuario_id && (int)auth()->id() !== (int)$order->usuario_id) throw \Illuminate\Validation\ValidationException::withMessages(['pedido'=>'Inicia sesión con la cuenta de esta compra antes de continuar el pago.']);
            if (!$order->usuario_id && auth()->check()) throw \Illuminate\Validation\ValidationException::withMessages(['pedido'=>'Esta compra es de invitado. Continúala en una sesión sin cuenta.']);
            if (strtolower($order->estado)!=='pendiente' || \Illuminate\Support\Facades\DB::table('payment_reconciliations')->where('pedido_id',$order->id)->whereIn('status',['authorizing','approved','needs_review','applied'])->exists()) throw \Illuminate\Validation\ValidationException::withMessages(['pedido'=>'Esta compra ya está pagada o en verificación. No repitas el cobro; consulta el estado con soporte.']);
            if (session('cart',[]) && session('checkout_pedido')!==$codigo) throw \Illuminate\Validation\ValidationException::withMessages(['pedido'=>'Tu navegador tiene otro carrito. Guárdalo o vacíalo antes de recuperar esta compra.']);
            $cart=[];
            foreach ($order->items()->with('variante.producto.imagenes')->get() as $item) {
                $variant=$item->variante;
                if (!$variant?->activo || !$variant->producto?->activo) throw \Illuminate\Validation\ValidationException::withMessages(['pedido'=>'Un artículo ya no está disponible. Contacta a soporte para revisar esta compra.']);
                $cart['v-'.$variant->id]=['id'=>$variant->producto_id,'line_id'=>'v-'.$variant->id,'variante_id'=>$variant->id,'codigo'=>$variant->sku,'nombre'=>$item->producto_nombre ?: $variant->producto->nombre,'cantidad'=>$item->cantidad,'precio'=>\App\Services\Storefront\VariantPricing::quote($variant)['price'],'imagen'=>$variant->producto->imagenes->first()?->url];
            }
            \Illuminate\Support\Facades\DB::table('payment_reconciliations')->where('pedido_id',$order->id)->whereIn('status',['prepared','preparing'])->update(['status'=>'expired','updated_at'=>now()]);
            \Illuminate\Support\Facades\DB::table('reservas_stock')->where('session_id',$order->checkout_session_id)->delete();
            \Illuminate\Support\Facades\DB::table('checkout_benefit_reservations')->where('pedido_id',$order->id)->delete();
            session()->forget(['niubiz_quote','niubiz_amount','niubiz_purchaseNumber']);
            session(['cart'=>$cart,'checkout_pedido'=>$order->codigo]);
            app(\App\Services\Cart\CartService::class)->syncCartToDB($cart,session()->getId());
        });
        return redirect()->route('checkout')->with('success','Compra recuperada. Confirma nuevamente precios, entrega, beneficios y facturación antes de pagar.');
    }
    public function requestReturn(Request $request, string $codigo)
    {
        $data = $request->validate(['type'=>'required|in:return,exchange,warranty','producto_id'=>'nullable|integer','reason'=>'required|string|max:255','description'=>'nullable|string|max:5000','request_key'=>'required|uuid']);
        $order = Pedido::where('codigo',$codigo)->firstOrFail();
        app(ReturnRequestService::class)->create($order,$data,$order->usuario_id);
        return redirect(URL::temporarySignedRoute('store.order.access',now()->addDays(60),['codigo'=>$codigo]))->with('success','Solicitud recibida. Se revisarán recepción, condición y solución antes de confirmar cualquier devolución.');
    }
}
