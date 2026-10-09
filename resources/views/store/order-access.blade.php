<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Mi compra {{ $order->codigo }}</title>
<style>body{font:16px system-ui;background:#f5f7fa;color:#172b45;margin:0}main{max-width:800px;margin:30px auto;padding:24px;background:white;border-radius:16px}label,input,select,textarea{display:block;margin:12px 0}input,select,textarea{padding:10px;max-width:100%;box-sizing:border-box;width:100%}button{background:#004797;color:white;border:0;border-radius:8px;padding:12px}a{color:#004797}li{margin:12px 0}.notice{padding:12px;background:#f0f5ff}</style></head><body><main>
<a href="/">Volver a la tienda</a><h1>Tu compra {{ $order->codigo }}</h1><p>Estado: {{ $order->estado }} · Total: S/ {{ number_format($order->total,2) }}</p>
<p>Entrega: {{ $order->envio?->estado ?? 'Pendiente de preparación' }}@if($order->fulfilled_at) · Confirmada el {{ $order->fulfilled_at->format('d/m/Y') }}@endif</p>
@if(in_array($paymentStatus,['authorizing','approved','needs_review']))<p class="notice">Tu pago está en verificación. No vuelvas a pagar. Contacta a soporte con el código de esta compra.</p>
@elseif(strtolower($order->estado)==='pendiente')<form method="post" action="{{ $resumeUrl }}">@csrf<button>Recuperar esta compra para confirmar y pagar</button></form>@endif
@if(session('success'))<p role="status" class="notice">{{ session('success') }}</p>@endif
@if($errors->any())<div role="alert">@foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach</div>@endif
<ul>@foreach($order->items as $item)<li>{{ $item->producto_nombre ?: 'Artículo comprado' }} · {{ $item->sku }} · {{ $item->cantidad }} unidades</li>@endforeach</ul>
<h2>Solicitudes de posventa</h2>@forelse($requests as $rma)<p>{{ $rma->type }} · {{ $rma->status }} · {{ $rma->reason }}</p>@empty<p>Aún no tienes solicitudes.</p>@endforelse
<p>Los cambios se tramitan como recepción del producto y devolución del importe correspondiente; la opción nueva se compra con precio y disponibilidad confirmados. Las garantías se revisan según el producto y la documentación de su proveedor.</p>
@if($order->fulfilled_at || strtolower($order->estado)==='completado')
<form method="post" action="{{ $returnUrl }}">@csrf<input type="hidden" name="request_key" value="{{ Illuminate\Support\Str::uuid() }}">
<label>Tipo<select name="type"><option value="return">Devolución</option><option value="exchange">Cambio mediante devolución y nueva compra</option><option value="warranty">Revisión de garantía</option></select></label>
<label>Motivo<input name="reason" required maxlength="255"></label><label>Detalle<textarea name="description" maxlength="5000" rows="4"></textarea></label><button>Solicitar revisión de mi compra</button></form>
@endif
<p class="notice">Conserva este enlace privado. Su acceso permite gestionar esta compra.</p>
</main></body></html>
