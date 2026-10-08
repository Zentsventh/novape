<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>¿Olvidaste algo en tu carrito?</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #111827; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { color: #dc2626; font-size: 24px; text-align: center; }
        p { line-height: 1.6; font-size: 16px; color: #4b5563; }
        .btn { display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; text-align: center; }
        .items { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .item { display: flex; align-items: center; margin-bottom: 15px; }
        .item img { width: 60px; height: 60px; object-fit: contain; margin-right: 15px; border: 1px solid #e5e7eb; border-radius: 4px; }
        .item-info { flex-grow: 1; }
        .item-name { font-weight: bold; font-size: 14px; }
        .item-price { color: #dc2626; font-weight: bold; font-size: 14px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>¡Hola, {{ $usuario->nombres }}!</h1>
        <p>Notamos que dejaste algunos productos excelentes en tu carrito y no completaste tu compra. ¡Aún están esperándote!</p>
        <p>Regresa ahora y completa tu pedido antes de que se agote el stock.</p>
        
        <div class="items">
            @foreach($cartItems as $item)
                @if($item->variante && $item->variante->producto)
                    <div class="item">
                        @if($item->variante->producto->imagenes->first())
                            <img src="{{ $item->variante->producto->imagenes->first()->url }}" alt="{{ $item->variante->producto->nombre }}">
                        @endif
                        <div class="item-info">
                            <div class="item-name">{{ $item->variante->producto->nombre }}</div>
                            <div class="item-price">S/ {{ number_format($item->variante->precio, 2) }}</div>
                            <div style="font-size: 12px; color: #6b7280;">Cantidad: {{ $item->cantidad }}</div>
                        </div>
                    </div>
                @endif
            @endforeach
        </div>

        <div style="text-align: center;">
            <a href="{{ url('/checkout') }}" class="btn">FINALIZAR MI COMPRA</a>
        </div>

        <div class="footer">
            <p><a href="{{ \Illuminate\Support\Facades\URL::signedRoute('marketing.unsubscribe', ['user' => $usuario->id, 'recipient' => hash('sha256', mb_strtolower($usuario->email))]) }}">Dejar de recibir promociones y recordatorios</a></p>
            <p>Si tienes alguna pregunta o necesitas ayuda, responde a este correo.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
