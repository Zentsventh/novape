<?php
declare(strict_types=1);
namespace App\Services\Orders;
use App\Models\Pedido;
use App\Models\RmaRequest;
use App\Services\Storefront\CommercePolicy;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

final class ReturnRequestService
{
    public function create(Pedido $order, array $data, ?int $owner, array $images = []): RmaRequest
    {
        return DB::transaction(function () use ($order,$data,$owner,$images) {
            $order = Pedido::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $type = $data['type']; $product = $data['producto_id'] ?? null;
            if ($owner !== null && (int)$order->usuario_id !== $owner) abort(403);
            $key = $data['request_key'] ?? (string)Str::uuid();
            if ($existing = RmaRequest::where('request_key',$key)->first()) {
                if ($existing->pedido_id !== $order->id || $existing->type !== $type || (int)$existing->producto_id !== (int)$product) $this->invalid('La referencia ya identifica otra solicitud.');
                return $existing;
            }
            if ($product && !DB::table('pedido_item as i')->join('variante as v','v.id','=','i.variante_id')->where('i.pedido_id',$order->id)->where('v.producto_id',$product)->exists()) $this->invalid('El producto no pertenece a esta compra.');
            if ($order->stock_returned_at || !$order->stock_consumed_at) $this->invalid('Este pedido no tiene mercancía pendiente de devolución.');
            if (!$order->fulfilled_at && strtolower($order->estado) !== 'completado') $this->invalid('La posventa comienza después de la entrega o retiro. Si aún no recibes el pedido, contacta a soporte para revisar el envío o cancelación.');
            $policy = $order->commerce_policy_snapshot ?: CommercePolicy::summary();
            if ($type !== 'warranty' && $order->fulfilled_at && $order->fulfilled_at->copy()->addDays($policy['return_window_days'])->isPast()) $this->invalid('La ventana comercial de devolución finalizó. Contacta a soporte si existe un defecto o incidencia para su revisión.');
            $open = RmaRequest::where('pedido_id',$order->id)->whereIn('status',['pending','approved','received']);
            if ($product) $open->where(fn($q)=>$q->whereNull('producto_id')->orWhere('producto_id',$product));
            if ($open->exists()) $this->invalid('Ya existe una solicitud abierta para estos artículos. Continúa la solicitud existente.');
            return RmaRequest::create(['usuario_id'=>$owner,'pedido_id'=>$order->id,'producto_id'=>$product,'type'=>$type,
                'reason'=>$data['reason'],'description'=>$data['description'] ?? null,'images'=>$images,'request_key'=>$key,
                'guest_email'=>$owner === null ? ($order->direccion_envio_snapshot['email'] ?? null) : null,
                'policy_snapshot'=>$policy]);
        });
    }
    private function invalid(string $message): never { throw ValidationException::withMessages(['pedido_id'=>$message]); }
}
