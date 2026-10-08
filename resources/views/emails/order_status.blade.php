<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Actualización de Pedido</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #0056b3;">NOVAPE</h1>
        <h2>Actualización de tu pedido #{{ $pedido->codigo }}</h2>
    </div>

    <p>Hola {{ $pedido->usuario ? $pedido->usuario->nombres : 'Cliente' }},</p>
    <p>Queríamos informarte que el estado de tu pedido ha cambiado a:</p>
    
    <div style="background: #e0f2fe; color: #0284c7; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0;">
        {{ strtoupper($pedido->estado) }}
    </div>

    @if($pedido->delivery_status)<p>Entrega: {{ $pedido->delivery_status }}</p>@endif
    @if($pedido->tracking_number)<p>Seguimiento: {{ $pedido->tracking_number }} · {{ $pedido->courier_name }}</p>@endif
    @if($pedido->pickup)<p>Retiro: {{ $pedido->pickup['address'] ?? '' }}. Horario: {{ $pedido->pickup['hours'] ?? '' }}.</p>@endif
    <p>Puedes consultar el estado con tu código en <a href="{{ url('/seguimiento') }}">seguimiento de pedido</a>.</p>
    <p>Gracias por confiar en nosotros.</p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center;">
        &copy; {{ date('Y') }} NOVAPE. Todos los derechos reservados.
    </div>

</body>
</html>
