<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        .btn { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>¡Pago Recibido Exitosamente!</h1>
    </div>
    <div class="content">
        <p>Hola <strong>{{ $pedido['cliente_nombre'] ?? 'Cliente' }}</strong>,</p>
        
        <p>Hemos procesado correctamente tu pago por la cantidad de <strong>S/ {{ number_format($pedido['monto_total'], 2) }}</strong>.</p>
        
        <p>Tu código de pedido es: <strong>{{ $pedido['codigo'] }}</strong></p>
        
        <p>Adjunto a este correo encontrarás el PDF con los detalles de tu compra y comprobante de pago electrónico.</p>
        
        <p>Si tienes alguna consulta sobre tu entrega, por favor contáctanos respondiendo a este mensaje.</p>
        
        <div style="text-align: center;">
            <a href="{{ url('/catalogo') }}" class="btn">Seguir Comprando</a>
        </div>
    </div>
</body>
</html>
