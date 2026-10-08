<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Confirmación de Pedido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 20px; background-color: #000; padding: 20px 0; border-radius: 8px 8px 0 0;">
        <img src="{{ url('images/logofactura.png') }}" alt="NOVAPE" style="height: 50px;">
    </div>
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #333;">¡Gracias por tu compra!</h2>
    </div>

    <p>Hola {{ $pedido->usuario ? $pedido->usuario->nombres : 'Cliente' }},</p>
    <p>Hemos recibido tu pedido <strong>#{{ $pedido->codigo }}</strong> y estamos procesándolo. Aquí tienes un resumen:</p>

    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3>Resumen del Pedido</h3>
        <ul style="list-style: none; padding: 0;">
            @foreach($pedido->items as $item)
                <li style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    {{ $item->cantidad }}x {{ $item->variante && $item->variante->producto ? $item->variante->producto->nombre : 'Producto' }} 
                    <span style="float: right;">S/ {{ number_format($item->subtotal, 2) }}</span>
                </li>
            @endforeach
        </ul>
        <div style="text-align: right; font-weight: bold; font-size: 18px; margin-top: 10px;">
            Total: S/ {{ number_format($pedido->total, 2) }}
        </div>
    </div>

    <p>Te informaremos cuando tu pedido avance a entrega o retiro.</p>
    <p><a href="{{ \Illuminate\Support\Facades\URL::temporarySignedRoute('store.order.access', now()->addDays(60), ['codigo'=>$pedido->codigo]) }}">Consultar mi compra y solicitar posventa</a>. Conserva este enlace privado; también funciona sin iniciar sesión.</p>

    @if($pedido->comprobante)
        <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="margin-top: 0;">Tu Comprobante Electrónico ({{ $pedido->comprobante->serie }}-{{ $pedido->comprobante->numero }})</h3>
            <p>El comprobante electrónico ha sido generado exitosamente para tu compra.</p>
            @if($pedido->comprobante->enlace_pdf)
                <a href="{{ $pedido->comprobante->enlace_pdf }}" style="display: inline-block; padding: 10px 20px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Descargar PDF</a>
            @endif
            @if($pedido->comprobante->enlace_xml)
                <a href="{{ $pedido->comprobante->enlace_xml }}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Descargar XML</a>
            @endif
        </div>
    @endif

    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center;">
        &copy; {{ date('Y') }} NOVAPE. Todos los derechos reservados.
    </div>

</body>
</html>
